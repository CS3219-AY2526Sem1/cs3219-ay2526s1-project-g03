import z from 'zod';
import catchErrors from '../utils/catchErrors';
import {HTTP_CREATED, HTTP_OK, HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import {
  createAccount,
  verifyEmail,
  loginUser,
  refreshUserAccessToken,
} from '../services/authService';
import {registerSchema, verificationCodeSchema, loginSchema} from './authSchema';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from '../utils/cookies';
import appAssert from '../utils/appAssert';
import {verifyToken} from '../utils/jwt.ts';
import Session from '../models/session.ts';
import {clearAuthCookies} from '../utils/cookies.ts';
import {emailSchema, passwordResetSchema} from './authSchema.ts';
import {forgotPassword, resendEmail, resetPassword} from '../services/authService.ts';
import VerificationCode from '../models/verificationCode.ts';

/**
 * Handles POST request for user registration (`POST /auth/register`).
 * Validates request body using `registerSchema`.
 *
 * @param {Request} req - Express request object containing request details.
 * @param {Response} res - Express response object for sending the error response.
 */
export const registerController = catchErrors(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
  });

  const {user, accessToken, refreshToken} = await createAccount(request);

  return setAuthCookies({res, accessToken, refreshToken}).status(HTTP_CREATED).json(user);
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(verificationCode);

  return res.status(HTTP_OK).json({
    message: 'Email was successfully verified!',
  });
});

export const resendEmailController = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await resendEmail(email);

  return res.status(HTTP_OK).json({
    message: 'Verification email resent!',
  });
});

export const forgotPasswordController = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email); // OK to send invalid email errors

  await forgotPassword(email); // Errors are hidden from front end.

  return res.status(HTTP_OK).json({
    message: 'Password reset email sent!',
  });
});

export const resetPasswordController = catchErrors(async (req, res) => {
  4;
  const request = passwordResetSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookies(res).status(HTTP_OK).json({
    message: 'Password reset successful!',
  });
});

export const loginController = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
  });

  const isEmail = z.email().safeParse(request.identifier).success;

  const loginData = isEmail
    ? {email: request.identifier, password: request.password}
    : {username: request.identifier, password: request.password};

  const {accessToken, refreshToken} = await loginUser(loginData);

  return setAuthCookies({res, accessToken, refreshToken}).status(HTTP_OK).json({
    message: 'Login successful!',
  });
});

export const logoutController = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const {payload, _} = verifyToken(accessToken);

  if (payload) {
    await Session.findByIdAndDelete(payload.sessionId);
  }

  return clearAuthCookies(res).status(HTTP_OK).json({
    message: 'Logout successful',
  });
});

export const refreshController = catchErrors(async (req, res) => {
  const {refreshToken} = req.cookies;
  appAssert(refreshToken, HTTP_UNAUTHORIZED, 'Missing refresh token!');

  const {accessToken, newRefreshToken} = await refreshUserAccessToken(refreshToken);

  if (newRefreshToken) {
    res.cookie('refreshToken', newRefreshToken, getRefreshTokenCookieOptions());
  }

  res.status(HTTP_OK).cookie('accessToken', accessToken, getAccessTokenCookieOptions()).json({
    message: 'Access token refreshed',
  });
});
