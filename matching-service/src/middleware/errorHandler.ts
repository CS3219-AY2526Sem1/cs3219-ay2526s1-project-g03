import type { Request, Response, NextFunction } from 'express';

// take from question service

interface AppError extends Error {
  statusCode?: number;
}

/**
 * Handles requests to routes that do not exist.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error: AppError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * A centralized error handler.
 */
export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  // Ensure the Express error signature keeps 4 params; mark next as used for linters
  void next;
  void res; // mark as used for linting; res is used below too
  const statusCode = err.statusCode || 500;

  console.error(`[${statusCode}] ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  console.error(err.stack);

  res.status(statusCode).json({
    message: err.message,
    // Provide stack trace only in development for security reasons
    // Hide the stack by showing a pancake emoji as a placeholder when the app is in production mode
    stack: process.env['NODE_ENV'] === 'production' ? '🥞' : err.stack,
  });
};