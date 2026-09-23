import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { User } from '../models/index.js';
import { hashPassword, verifyPassword } from '../services/password.js';

export const authRouter = Router();
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(10).max(128),
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
});
const safeUser = (u: {
  _id: { toString(): string };
  name: string;
  email: string;
  referralCode: string;
}) => ({
  id: u._id.toString(),
  name: u.name,
  email: u.email,
  referralCode: u.referralCode,
});

authRouter.post('/signup', authLimit, async (req, res) => {
  const data = credentials
    .extend({
      name: z.string().trim().min(2).max(80),
      referralCode: z
        .string()
        .regex(/^[a-f0-9]{12}$/)
        .optional(),
    })
    .parse(req.body);
  const referrer = data.referralCode
    ? await User.findOne({ referralCode: data.referralCode })
    : null;
  if (data.referralCode && !referrer)
    throw new ApiError(400, 'INVALID_REFERRAL', 'This referral code is not valid');
  try {
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      referralCode: randomBytes(6).toString('hex'),
      referredBy: referrer?._id,
    });
    res.status(201).json({ token: signToken(user.id), user: safeUser(user) });
  } catch (err) {
    if ((err as { code?: number }).code === 11000)
      throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    throw err;
  }
});

authRouter.post('/login', authLimit, async (req, res) => {
  const data = credentials.parse(req.body);
  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  const fallback = '00000000000000000000000000000000:' + '00'.repeat(64);
  const valid = await verifyPassword(data.password, user?.passwordHash ?? fallback);
  if (!user || !valid)
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  res.json({ token: signToken(user.id), user: safeUser(user) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Account not found');
  const referralCount = await User.countDocuments({ referredBy: user._id });
  res.json({
    user: safeUser(user),
    referralCount,
    referralLink: `${env.PUBLIC_APP_URL}/?ref=${user.referralCode}`,
  });
});
