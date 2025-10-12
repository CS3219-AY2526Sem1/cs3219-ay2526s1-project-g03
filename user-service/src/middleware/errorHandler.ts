import type {ErrorRequestHandler, Response} from 'express';
import {z} from 'zod';
import {HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR} from '../constants/httpStatus';
import AppError from '../utils/appError';
import {clearAuthCookies, REFRESH_PATH} from '../utils/cookies';

/**
 * Converts ZodErrors into HTTP BAD_REQUESTS.
 *
 * @param {Response} res - Express response object for sending the error response.
 * @param {Error} error - The error object thrown or passed from previous middleware.
 * @returns {Response} Returns a 400 status response with error message.
 */
const handleZodError = (res: Response, error: z.ZodError) =>
  res.status(HTTP_BAD_REQUEST).send(error);

const handleAppError = (res: Response, error: AppError) =>
  res.status(error.statusCode).json({
    message: error.message,
  });

/**
 * Error handling middleware.
 * Catches and processes all errors that occur during processing.
 *
 * @param {Error} error - The error object thrown or passed from previous middleware.
 * @param {Request} req - Express request object containing request details.
 * @param {Response} res - Express response object for sending the error response.
 * @param {NextFunction} next - Express next function (required for error handler signature).
 * @returns {Response} Returns a 500 status response with error message.
 */
const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

  if (error instanceof z.ZodError) {
    return handleZodError(res, error);
  }

  if (error instanceof AppError) {
    return handleAppError(res, error);
  }

  return res.status(HTTP_INTERNAL_SERVER_ERROR).send('Internal server error');
};

export default errorHandler;
