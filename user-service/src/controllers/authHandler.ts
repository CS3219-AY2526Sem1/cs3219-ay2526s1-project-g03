import passport from 'passport';
import z from 'zod';
import {HTTP_CREATED, HTTP_OK, HTTP_UNAUTHORIZED} from '../constants/httpStatus.ts';
import OAuthType from '../constants/oAuthTypes.ts';
import {
  createAccount,
  forgotPassword,
  handleOAuthCallback,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} from '../services/authService.ts';
import {deleteSession} from '../services/sessionService.ts';
import appAssert from '../utils/appAssert.ts';
import catchErrors from '../utils/catchErrors.ts';
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from '../utils/cookies.ts';
import {verifyToken} from '../utils/jwt.ts';
import {
  emailSchema,
  loginSchema,
  passwordResetSchema,
  registerSchema,
  verificationCodeSchema,
} from './userSchema.ts';

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

/**
 * Verifies verification code sent via email.
 */
export const verifyEmailController = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(verificationCode);

  return res.status(HTTP_OK).json({
    message: 'Email was successfully verified!',
  });
});

/**
 * Resends verification email.
 */
export const resendEmailController = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await sendVerificationEmail(email);

  return res.status(HTTP_OK).json({
    message: 'Verification email resent!',
  });
});

/**
 * Sends a forgot password email.
 */
export const forgotPasswordController = catchErrors(async (req, res) => {
  const email = emailSchema.parse(req.body.email); // OK to send invalid email errors

  await forgotPassword(email); // Errors are hidden from front end.

  return res.status(HTTP_OK).json({
    message: 'Password reset email sent!',
  });
});

/**
 * Resets user password.
 */
export const resetPasswordController = catchErrors(async (req, res) => {
  4;
  const request = passwordResetSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookies(res).status(HTTP_OK).json({
    message: 'Password reset successful!',
  });
});

/**
 * Logs user into application.
 */
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

/**
 * Logs user out.
 */
export const logoutController = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const {payload, _} = verifyToken(accessToken);

  if (payload) {
    await deleteSession(payload.sessionId);
  }

  return clearAuthCookies(res).status(HTTP_OK).json({
    message: 'Logout successful',
  });
});

/**
 * Refreshes user tokens.
 */
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

/**
 * Initiates Google OAuth authentication flow.
 * Redirect's user to Google's consent screen to authorize access to their profile and email.
 */
export const googleAuthController = (req, res, next) => {
  const state = req.query.link === 'true' ? JSON.stringify({link: true}) : undefined;

  passport.authenticate(OAuthType.Google, {
    session: false,
    scope: ['profile', 'email'],
    state: state,
  })(req, res, next);
};

/**
 * Handles the OAuth callback after user authorizes the application on Google.
 * Processes the authorization code, retrieves user prfile and either
 *   Creates a new user account.
 *   Links to an existing user.
 *   Logs in an existing user.
 * On failure, redirects the user with error query parameter.
 */
export const googleCallbackController = handleOAuthCallback(OAuthType.Google);

/**
 * Initiates GitHub OAuth authentication flow.
 * Redirect's user to GitHub's consent screen to authorize access to their profile and email.
 */
export const githubAuthController = (req, res, next) => {
  const state = req.query.link === 'true' ? JSON.stringify({link: true}) : undefined;

  passport.authenticate(OAuthType.GitHub, {
    session: false,
    scope: ['read:user', 'user:email'],
    state: state,
  })(req, res, next);
};

/**
 * Handles the OAuth callback after user authorizes the application on GitHub.
 * Processes the authorization code, retrieves user prfile and either
 *   Creates a new user account.
 *   Links to an existing user.
 *   Logs in an existing user.
 * On failure, redirects the user with error query parameter.
 */
export const githubCallbackController = handleOAuthCallback(OAuthType.GitHub);
