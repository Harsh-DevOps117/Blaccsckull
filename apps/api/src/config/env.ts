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
    PAYMENT_MODE: z.enum(['demo', 'disabled']).default('demo'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SEED_DEMO_PASSWORD: z.string().min(10).optional(),
  })
  .parse(process.env);

export function paymentMode() {
  return env.PAYMENT_MODE;
}
