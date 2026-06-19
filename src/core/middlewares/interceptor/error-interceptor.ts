import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../../error/base-error';

export function errorInterceptor(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof BaseError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.errorCode,
        description: err.description,
      },
    });
    return;
  }

  console.error('[ErrorInterceptor] Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      description: 'An unexpected error occurred',
    },
  });
}
