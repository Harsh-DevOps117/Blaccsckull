import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { env } from './config/env.js';
import { optionalAuth } from './middleware/auth.js';
import { ApiError, errorHandler } from './middleware/errors.js';
import { authRouter } from './routes/auth.js';
import { competitionRouter } from './routes/competitions.js';
import { webhookRouter } from './routes/webhooks.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors());

app.use((_req, res, next) => {
  res.set('X-Request-Id', randomUUID());
  next();
});
app.use('/api/webhooks', webhookRouter);
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
});
app.use('/media', express.static('public', { maxAge: '1d' }));
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: env.NODE_ENV === 'test' ? 10000 : 240,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Please wait a minute and try again.',
      },
    },
  }),
  optionalAuth,
);
app.use('/api/auth', authRouter);
app.use('/api/competitions', competitionRouter);
app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
app.use(errorHandler);
