import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { connectDatabase } from '../config/db.js';
import { env, paymentMode } from '../config/env.js';
import { Competition, Registration, User } from '../models/index.js';
import { hashPassword } from '../services/password.js';
import { registerForCompetition } from '../services/registration.js';
import { competitionFixture } from './fixture.js';

try {
  if (!env.SEED_DEMO_PASSWORD) throw new Error('SEED_DEMO_PASSWORD is required');
  if (env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
  await connectDatabase();
  await Promise.all([Competition.init(), User.init(), Registration.init()]);
  const fixture = competitionFixture();
  let competition = await Competition.findOne({ slug: fixture.slug });
  if (!competition) competition = await Competition.create(fixture);
  let user = await User.findOne({ email: 'demo@feedants.com' });
  if (!user)
    user = await User.create({
      name: 'Ananya Sharma',
      email: 'demo@feedants.com',
      passwordHash: await hashPassword(env.SEED_DEMO_PASSWORD),
      referralCode: randomBytes(6).toString('hex'),
    });
  if (paymentMode() === 'demo') await registerForCompetition(fixture.slug, user.id, true);
  console.log(
    'Seed ready. Sign in as demo@feedants.com using SEED_DEMO_PASSWORD. Existing data was preserved.',
  );
} catch (error) {
  console.error(
    'Seed failed:',
    (error as Error).name,
    (error as { code?: string }).code ?? 'Check configuration and connectivity',
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
