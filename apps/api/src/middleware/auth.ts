import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './errors.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next();
  try {
    if (!authorization.startsWith('Bearer ')) throw new Error();
    const payload = jwt.verify(authorization.slice(7), env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'feedants-api',
      audience: 'feedants-app',
    });
    if (typeof payload === 'string' || !payload.sub || !/^[a-f0-9]{24}$/.test(payload.sub))
      throw new Error();
    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Your session expired. Please sign in again.'));
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.userId) return next(new ApiError(401, 'UNAUTHORIZED', 'Please sign in to continue'));
  next();
};

export function signToken(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: '7d',
    issuer: 'feedants-api',
    audience: 'feedants-app',
  });
}
