import { afterEach, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { allowsOrigin } from '../src/config/cors.js';
const original = env.NODE_ENV;
afterEach(() => {
  env.NODE_ENV = original;
});
it('allows development browsers on alternate Expo ports', () => {
  expect(allowsOrigin('http://localhost:8082')).toBe(true);
  expect(allowsOrigin('http://192.168.1.19:8082')).toBe(true);
  expect(allowsOrigin('https://untrusted.example:8082')).toBe(false);
});
it('requires configured origins in production', () => {
  env.NODE_ENV = 'production';
  expect(allowsOrigin('http://localhost:8082')).toBe(false);
  expect(allowsOrigin(env.CORS_ORIGINS.split(',')[0])).toBe(true);
});
