import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global centralized error handler.
 * Prevents stack trace leakage and guarantees uniform JSON format.
 */
export function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}
