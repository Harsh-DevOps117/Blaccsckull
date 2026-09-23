import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { readdir, unlink, readFile } from 'node:fs/promises';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { signToken } from '../src/middleware/auth.js';
import { Competition, Registration, User } from '../src/models/index.js';
import { competitionFixture } from '../src/scripts/fixture.js';

let replica: MongoMemoryReplSet;
const slug = 'feedants-classical-dance';
const route = `/api/competitions/${slug}`;
async function makeUser() {
  const user = await User.create({
    name: 'Test Dancer',
    email: `${randomBytes(8).toString('hex')}@example.com`,
    passwordHash: 'not-used-by-token-tests',
    referralCode: randomBytes(6).toString('hex'),
  });
  return { user, auth: `Bearer ${signToken(user._id.toString())}` };
}
const enroll = (auth: string) =>
  request(app)
    .post(`${route}/register`)
    .set('Authorization', auth)
    .send({ acceptDemoPayment: true });

beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({
    binary: { version: '7.0.14' },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  await mongoose.connect(replica.getUri(), {
    dbName: 'feedants_isolated_test',
  });
  await Promise.all([Competition.init(), Registration.init(), User.init()]);
});
beforeEach(async () => {
  await Promise.all([Competition.deleteMany({}), Registration.deleteMany({}), User.deleteMany({})]);
  await Competition.create(competitionFixture());
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});

describe('HTTP API with a real isolated MongoDB replica set', () => {
  it('rejects malformed and oversized JSON with client errors', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{broken')
      .expect(400);
    await request(app)
      .post('/api/auth/login')
      .send({ password: 'x'.repeat(17000) })
      .expect(413);
  });
  it('serves database content, computed rewards and anonymous action', async () => {
    const response = await request(app).get(route).expect(200);
    expect(response.body.competition.prizePool).toBe(150000);
    expect(response.body.competition.spotsLeft).toBe(20);
    expect(response.body.action.type).toBe('register');
    expect(response.body.participation).toBeNull();
  });
  it('protects registration from anonymous requests and forged tokens', async () => {
    await request(app).post(`${route}/register`).send({ acceptDemoPayment: true }).expect(401);
    await request(app).get(route).set('Authorization', 'Bearer forged').expect(401);
  });
  it('requires explicit demo payment acceptance', async () => {
    const { auth } = await makeUser();
    await request(app).post(`${route}/register`).set('Authorization', auth).send({}).expect(409);
    expect(await Registration.countDocuments()).toBe(0);
    expect((await Competition.findOne({ slug }))!.booked).toBe(0);
  });
  it('handles 30 concurrent users competing for five spots without overselling', async () => {
    await Competition.updateOne({ slug }, { capacity: 5 });
    const users = await Promise.all(Array.from({ length: 30 }, makeUser));
    const results = await Promise.all(users.map((u) => enroll(u.auth)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(5);
    expect(results.filter((r) => r.status === 409)).toHaveLength(25);
    expect(await Registration.countDocuments()).toBe(5);
    expect((await Competition.findOne({ slug }))!.booked).toBe(5);
  });
  it('makes 12 concurrent duplicate requests idempotent', async () => {
    const { auth } = await makeUser();
    const results = await Promise.all(Array.from({ length: 12 }, () => enroll(auth)));
    expect(results.every((r) => [200, 201].includes(r.status))).toBe(true);
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await Registration.countDocuments()).toBe(1);
    expect((await Competition.findOne({ slug }))!.booked).toBe(1);
  });
  it('keeps retries idempotent after registration closes', async () => {
    const { auth } = await makeUser();
    await enroll(auth).expect(201);
    await Competition.updateOne({ slug }, { registrationClosesAt: new Date(Date.now() - 1) });
    await enroll(auth).expect(200);
    const other = await makeUser();
    await enroll(other.auth).expect(409);
  });
  it('blocks early registration and cancelled competition', async () => {
    const { auth } = await makeUser();
    await Competition.updateOne({ slug }, { registrationOpensAt: new Date(Date.now() + 60000) });
    await enroll(auth).expect(409);
    await Competition.updateOne(
      { slug },
      { status: 'cancelled', registrationOpensAt: new Date(0) },
    );
    await enroll(auth).expect(409);
    expect((await Competition.findOne({ slug }))!.booked).toBe(0);
  });
  it('does not expose drafts and returns missing competition errors', async () => {
    await Competition.updateOne({ slug }, { status: 'draft' });
    await request(app).get(route).expect(404);
    const list = await request(app).get('/api/competitions').expect(200);
    expect(list.body.competitions).toHaveLength(0);
    await request(app).get('/api/competitions/missing').expect(404);
  });
  it('isolates each participant’s state and uploaded video', async () => {
    const first = await makeUser();
    const second = await makeUser();
    await enroll(first.auth).expect(201);
    const own = await request(app).get(route).set('Authorization', first.auth).expect(200);
    const other = await request(app).get(route).set('Authorization', second.auth).expect(200);
    expect(own.body.participation.status).toBe('registered');
    expect(other.body.participation).toBeNull();
    await request(app).get(`${route}/submission`).set('Authorization', second.auth).expect(404);
    await request(app).post(`${route}/submission`).set('Authorization', second.auth).expect(403);
  });
  it('validates video signatures, titles and submission windows', async () => {
    const { auth } = await makeUser();
    await enroll(auth).expect(201);
    const before = await readdir('uploads');
    await request(app)
      .post(`${route}/submission`)
      .set('Authorization', auth)
      .field('title', 'My dance')
      .attach('video', Buffer.from('not a real video'), {
        filename: 'fake.mp4',
        contentType: 'video/mp4',
      })
      .expect(400);
    expect(await readdir('uploads')).toEqual(before);
    await request(app)
      .post(`${route}/submission`)
      .set('Authorization', auth)
      .field('title', 'My dance')
      .expect(400);
    await Competition.updateOne({ slug }, { submissionClosesAt: new Date(0) });
    await request(app).post(`${route}/submission`).set('Authorization', auth).expect(409);
  });
  it('stores a video, protects access and replaces the old file', async () => {
    const { auth } = await makeUser();
    await enroll(auth).expect(201);
    const video = await readFile('../../docs/demo-performance.mp4');
    await request(app)
      .post(`${route}/submission`)
      .set('Authorization', auth)
      .field('title', 'Kathak performance')
      .attach('video', video, {
        filename: 'dance.mp4',
        contentType: 'video/mp4',
      })
      .expect(201);
    const original = (await Registration.findOne())!.submission!.filename!;
    const detail = await request(app).get(route).set('Authorization', auth).expect(200);
    expect(detail.body.participation.status).toBe('submitted');
    await request(app).get(`${route}/submission`).expect(401);
    await request(app).get(`${route}/submission`).set('Authorization', auth).expect(200);
    await request(app)
      .post(`${route}/submission`)
      .set('Authorization', auth)
      .field('title', 'Final performance')
      .attach('video', video, {
        filename: 'final.mp4',
        contentType: 'video/mp4',
      })
      .expect(201);
    expect(await readdir('uploads')).not.toContain(original);
    const updated = (await Registration.findOne())!.submission!;
    expect(updated.title).toBe('Final performance');
    await unlink(`uploads/${updated.filename}`);
  });
  it('signs up, hashes passwords, logs in and rejects incorrect passwords', async () => {
    const credentials = {
      name: 'Ananya',
      email: 'Ananya@example.com',
      password: 'a-strong-test-password',
    };
    const signup = await request(app).post('/api/auth/signup').send(credentials).expect(201);
    expect(signup.body.user).not.toHaveProperty('passwordHash');
    const user = await User.findOne({ email: 'ananya@example.com' }).select('+passwordHash');
    expect(user!.passwordHash).not.toBe(credentials.password);
    await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'incorrect-password' })
      .expect(401);
    await request(app).post('/api/auth/signup').send(credentials).expect(409);
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.token}`)
      .expect(200);
  });
  it('attributes referral signups to a real user', async () => {
    const referrer = await makeUser();
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Referred dancer',
        email: 'referred@example.com',
        password: 'a-strong-test-password',
        referralCode: referrer.user.referralCode,
      })
      .expect(201);
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', referrer.auth)
      .expect(200);
    expect(response.body.referralCount).toBe(1);
    expect(response.body.referralLink).toContain(referrer.user.referralCode);
    await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Invalid',
        email: 'invalid@example.com',
        password: 'a-strong-test-password',
        referralCode: '000000000000',
      })
      .expect(400);
  });
});
