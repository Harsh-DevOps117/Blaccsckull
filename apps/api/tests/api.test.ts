import { env, paymentMode } from '../src/config/env.js';
import { PaymentOrder } from '../src/models/paymentOrder.js';
import { createHmac } from 'node:crypto';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { readdir, unlink, readFile } from 'node:fs/promises';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, afterEach, vi } from 'vitest';
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
  await Promise.all([Competition.init(), Registration.init(), User.init(), PaymentOrder.init()]);
});
beforeEach(async () => {
  env.RAZORPAY_KEY_ID = '';
  env.RAZORPAY_KEY_SECRET = '';
  env.RAZORPAY_WEBHOOK_SECRET = '';
  env.PAYMENT_MODE = 'demo';
  await PaymentOrder.deleteMany({});
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

afterEach(() => {
  vi.unstubAllGlobals();
});

function enableRazorpay() {
  env.RAZORPAY_KEY_ID = 'rzp_test_unitTest';
  env.RAZORPAY_KEY_SECRET = 'isolated-fake-provider-secret';
}
const captured = {
  id: 'pay_Test',
  order_id: 'order_Test',
  amount: 9900,
  currency: 'INR',
  status: 'captured',
  amount_refunded: 0,
};
function provider(payment = captured) {
  const mock = vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith('/orders'))
      return new Response(JSON.stringify({ id: 'order_Test', amount: 9900, currency: 'INR' }));
    if (url.endsWith('/orders/order_Test/payments'))
      return new Response(JSON.stringify({ items: [] }));
    if (url.endsWith('/capture')) return new Response(JSON.stringify(captured));
    if (url.endsWith('/refund')) return new Response(JSON.stringify({ id: 'rfnd_Test' }));
    return new Response(JSON.stringify(payment));
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}
function proof() {
  return {
    razorpay_order_id: 'order_Test',
    razorpay_payment_id: 'pay_Test',
    razorpay_signature: createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update('order_Test|pay_Test')
      .digest('hex'),
  };
}
const checkout = (auth: string) =>
  request(app).post(`${route}/payments/order`).set('Authorization', auth).send({});
const verify = (auth: string, body = proof()) =>
  request(app).post(`${route}/payments/verify`).set('Authorization', auth).send(body);

describe('Razorpay checkout and missing-key fallback', () => {
  it('uses simulation only when credentials are missing and honors explicit disable', () => {
    expect(paymentMode()).toBe('demo');
    env.RAZORPAY_KEY_ID = 'rzp_test_partial';
    expect(paymentMode()).toBe('demo');
    enableRazorpay();
    expect(paymentMode()).toBe('razorpay');
    env.PAYMENT_MODE = 'disabled';
    expect(paymentMode()).toBe('disabled');
  });
  it('prevents simulated registration when Razorpay keys are configured', async () => {
    enableRazorpay();
    const { auth } = await makeUser();
    await enroll(auth).expect(409);
    expect(await Registration.countDocuments()).toBe(0);
    const detail = await request(app).get(route).expect(200);
    expect(detail.body.paymentMode).toBe('razorpay');
    expect(JSON.stringify(detail.body)).not.toContain(env.RAZORPAY_KEY_SECRET);
  });
  it('creates an order with the database price, reuses it, and verifies only for its owner', async () => {
    enableRazorpay();
    const mock = provider();
    const first = await makeUser();
    const second = await makeUser();
    const order = await checkout(first.auth).expect(200);
    expect(order.body.amount).toBe(9900);
    expect(order.body.keyId).toBe(env.RAZORPAY_KEY_ID);
    expect(JSON.stringify(order.body)).not.toContain(env.RAZORPAY_KEY_SECRET);
    await checkout(first.auth).expect(200);
    expect(mock.mock.calls.filter(([url]) => url.endsWith('/orders'))).toHaveLength(1);
    await verify(second.auth).expect(404);
    await verify(first.auth).expect(200);
    await verify(first.auth).expect(200);
    expect((await Registration.findOne())!.payment!.status).toBe('paid');
    expect((await Competition.findOne())!.booked).toBe(1);
    expect((await PaymentOrder.findOne())!.status).toBe('registered');
  });
  it('rejects forged checkout signatures without fetching a payment', async () => {
    enableRazorpay();
    const mock = provider();
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    mock.mockClear();
    await verify(auth, { ...proof(), razorpay_signature: '0'.repeat(64) }).expect(400);
    expect(mock).not.toHaveBeenCalled();
    expect(await Registration.countDocuments()).toBe(0);
  });
  it('rejects amount mismatches even with a valid signature', async () => {
    enableRazorpay();
    provider({ ...captured, amount: 1 });
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    await verify(auth).expect(400);
    expect((await Competition.findOne())!.booked).toBe(0);
  });
  it('does not register failed or pending payments', async () => {
    enableRazorpay();
    provider({ ...captured, status: 'failed' });
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    await verify(auth).expect(409);
    expect(await Registration.countDocuments()).toBe(0);
  });
  it('captures authorized payments before registration', async () => {
    enableRazorpay();
    const mock = provider({ ...captured, status: 'authorized' });
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    await verify(auth).expect(200);
    expect(mock.mock.calls.some(([url]) => url.endsWith('/capture'))).toBe(true);
  });
  it('handles concurrent verification idempotently', async () => {
    enableRazorpay();
    provider();
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    const responses = await Promise.all(Array.from({ length: 8 }, () => verify(auth)));
    expect(responses.every((r) => r.status === 200)).toBe(true);
    expect(await Registration.countDocuments()).toBe(1);
    expect((await Competition.findOne())!.booked).toBe(1);
  });
  it('requests one refund when the last spot is lost during checkout', async () => {
    enableRazorpay();
    const mock = provider();
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    await Competition.updateOne({ slug }, { booked: 20 });
    await verify(auth).expect(409);
    await verify(auth).expect(409);
    expect(mock.mock.calls.filter(([url]) => url.endsWith('/refund'))).toHaveLength(1);
    expect((await PaymentOrder.findOne())!.status).toBe('refunded');
    expect(await Registration.countDocuments()).toBe(0);
  });
  it('keeps payment-provider errors as errors rather than enabling fallback', async () => {
    enableRazorpay();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')));
    const { auth } = await makeUser();
    await checkout(auth).expect(502);
    expect(paymentMode()).toBe('razorpay');
    await enroll(auth).expect(409);
  });
  it('recovers a captured payment after the client callback was lost', async () => {
    enableRazorpay();
    provider();
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (url: string) =>
          new Response(
            JSON.stringify(
              url.endsWith('/orders/order_Test/payments') ? { items: [captured] } : captured,
            ),
          ),
      ),
    );
    const result = await checkout(auth).expect(200);
    expect(result.body.registered).toBe(true);
    expect(await Registration.countDocuments()).toBe(1);
  });
  it('accepts authentic captured webhooks and rejects forged ones', async () => {
    enableRazorpay();
    provider();
    env.RAZORPAY_WEBHOOK_SECRET = 'isolated-webhook-secret';
    const { auth } = await makeUser();
    await checkout(auth).expect(200);
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: captured } },
    });
    const send = (signature: string) =>
      request(app)
        .post('/api/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(body);
    await send('0'.repeat(64)).expect(400);
    const signature = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
    await send(signature).expect(200);
    await send(signature).expect(200);
    expect(await Registration.countDocuments()).toBe(1);
  });
});
