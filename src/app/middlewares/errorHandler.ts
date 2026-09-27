import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../errors/DomainError.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        type: err.name,
        message: err.message
      }
    });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: {
      type: 'InternalServerError',
      message: 'An unexpected internal error occurred'
    }
  });
}
