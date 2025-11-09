import rateLimit from 'express-rate-limit';
import {
  LOGIN_LIMIT,
  FIFTEEN_MINUTES,
  REGISTER_LIMIT,
  PW_RESET_LIMIT,
  RATE_LIMIT_ERROR_MESSAGE,
} from '../constants/rateLimits';
import {HTTP_TOO_MANY_REQUESTS} from '../constants/httpStatus';

// Adapted from https://express-rate-limit.mintlify.app/quickstart/usage

export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: LOGIN_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMIT_ERROR_MESSAGE,
  statusCode: HTTP_TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(HTTP_TOO_MANY_REQUESTS).json({
      message: RATE_LIMIT_ERROR_MESSAGE,
    });
  },
});

export const emailSendLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: PW_RESET_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later!',
  statusCode: HTTP_TOO_MANY_REQUESTS,
  handler: (req, res) => {
    res.status(HTTP_TOO_MANY_REQUESTS).json({
      message: RATE_LIMIT_ERROR_MESSAGE,
    });
  },
});

export const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: REGISTER_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later!',
  statusCode: HTTP_TOO_MANY_REQUESTS,
  handler: (req, res) => {
    res.status(HTTP_TOO_MANY_REQUESTS).json({
      message: RATE_LIMIT_ERROR_MESSAGE,
    });
  },
});
