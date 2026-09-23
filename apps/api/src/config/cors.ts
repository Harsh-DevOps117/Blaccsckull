import { env } from './env.js';

export function allowsOrigin(origin: string | undefined) {
  if (!origin) return true;
  if (
    env.CORS_ORIGINS.split(',')
      .map((value) => value.trim())
      .includes(origin)
  )
    return true;
  if (env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const local =
      ['localhost', '127.0.0.1', '[::1]'].includes(host) ||
      /^10\.\d+\.\d+\.\d+$/.test(host) ||
      /^192\.168\.\d+\.\d+$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host);
    const port = Number(url.port);
    return (
      local &&
      ['http:', 'https:'].includes(url.protocol) &&
      ((port >= 8081 && port <= 8099) || (port >= 19000 && port <= 19006))
    );
  } catch {
    return false;
  }
}
