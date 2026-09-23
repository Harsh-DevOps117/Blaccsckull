import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    res.status(err.type === 'entity.too.large' ? 413 : 400).json({
      error: {
        code: 'INVALID_BODY',
        message:
          err.type === 'entity.too.large'
            ? 'Request body is too large'
            : 'Request body must be valid JSON',
      },
    });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      },
    });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      error: {
        code: err.code,
        message:
          err.code === 'LIMIT_FILE_SIZE' ? 'Video must be smaller than 50 MB' : 'Invalid upload',
      },
    });
    return;
  }
  const known = err instanceof ApiError;
  if (!known)
    console.error(
      JSON.stringify({
        event: 'request_error',
        name: err.name,
        code: err.code,
      }),
    );
  res.status(known ? err.status : 500).json({
    error: {
      code: known ? err.code : 'INTERNAL_ERROR',
      message: known ? err.message : 'Something went wrong. Please try again.',
    },
  });
};
