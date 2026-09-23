import 'dotenv/config';
import { z } from 'zod';

export const env = z
  .object({
    MONGODB_URI: z.string().min(1),
    MONGODB_DB: z.string().default('feedants_assignment'),
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(4000),
    CORS_ORIGINS: z.string().default('http://localhost:8081'),
    PUBLIC_API_URL: z.url().default('http://localhost:4000'),
    PUBLIC_APP_URL: z.url().default('http://localhost:8081'),
    PAYMENT_MODE: z.enum(['auto', 'demo', 'disabled']).default('auto'),
    RAZORPAY_KEY_ID: z.string().trim().default(''),
    RAZORPAY_KEY_SECRET: z.string().trim().default(''),
    RAZORPAY_WEBHOOK_SECRET: z.string().trim().default(''),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SEED_DEMO_PASSWORD: z.string().min(10).optional(),
  })
  .parse(process.env);

export function paymentMode() {
  if (env.PAYMENT_MODE === 'disabled') return 'disabled';
  return env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? 'razorpay' : 'demo';
}
