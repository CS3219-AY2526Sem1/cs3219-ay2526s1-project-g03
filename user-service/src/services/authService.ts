import passport from 'passport';
import {APP_ORIGIN} from '../constants/env';
import {
  EMAIL_VER_DAYS,
  EMAIL_RATE_LIMIT,
  EMAIL_TIME_LIMIT_HOURS,
  PW_RESET_MINS,
} from '../constants/expirables';
import {
  HTTP_CONFLICT,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_BAD_REQUEST,
  HTTP_TOO_MANY_REQUESTS,
} from '../constants/httpStatus';
import OAuthType from '../constants/oAuthTypes';
import VerificationType from '../constants/verificationTypes';
import Session from '../models/session';
import User from '../models/user';
import VerificationCode from '../models/verificationCode';
import appAssert from '../utils/appAssert';
import catchErrors from '../utils/catchErrors';
import {setAuthCookies} from '../utils/cookies';
import {daysFromNow, hoursAgo, minutesFromNow} from '../utils/date';
import {sendEmail} from '../utils/email';
import {
  refreshTokenSignOptions,
  signToken,
  verifyToken,
  type RefreshTokenPayload,
} from '../utils/jwt';
import {getVerifyEmail, getPasswordReset} from '../utils/verifyTemplate';
import {createSession, generateTokensForSession, renewSessionIfNeeded} from './sessionService';

export type CreateAccoutParams = {
  username: string;
  email: string;
  password: string;
};

/**
 * Creates a new user account.
 *
 * @param data User username, email and password.
 * @returns
 */
export const createAccount = async (data: CreateAccoutParams) => {
  // Check if user exists.
  const existingUser = await User.exists({
    $or: [{email: data.email}, {username: data.username}],
  }).collation({locale: 'en', strength: 2});
  appAssert(!existingUser, HTTP_CONFLICT, 'User / Email in use!');

  // Create user.
  const user = await User.create({
    username: data.username,
    email: data.email,
    password: data.password,
  });

  await sendVerificationEmail(user.email);

  const session = await createSession(user._id.toString());
  const {accessToken, refreshToken} = generateTokensForSession(
    user._id.toString(),
    session._id.toString()
  );

  return {user, accessToken, refreshToken};
};

/**
 * Verifies verification code.
 *
 * @param code Verification code.
 * @returns User object.
 */
export const verifyEmail = async (code: string) => {
  const validCode = await VerificationCode.findOne({
    _id: code,
    type: VerificationType.VerifyEmail,
    expiresAt: {$gt: new Date()},
  });
  appAssert(validCode, HTTP_NOT_FOUND, 'Invalid or expired verification code!');

  const updatedUser = await User.findByIdAndUpdate(validCode.userId, {verified: true}, {new: true});
  appAssert(updatedUser, HTTP_INTERNAL_SERVER_ERROR, 'Failed to verify email!');

  await validCode.deleteOne();

  return {
    user: updatedUser,
  };
};

/**
 * Verifies that an email has not exceeded the rate limit.
 * Note: operations here are not atomic, ie. under race conditions,
 * it is possible to exceed.
 * However, size of database is maintained small by consistently deletion of expired codes.
 *
 * @param email Email address of user.
 * @param type Type of verification.
 * @returns
 */
const verifyUserAndEmailRate = async (email: string, type: VerificationType) => {
  const user = await User.findOne({email});
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');

  await VerificationCode.deleteMany({
    type,
    createdAt: {$lte: hoursAgo(EMAIL_TIME_LIMIT_HOURS)},
  });

  // Due to deletion above, no longer need to check for time here.
  const count = await VerificationCode.countDocuments({
    userId: user._id,
    type,
  });

  appAssert(
    count < EMAIL_RATE_LIMIT,
    HTTP_TOO_MANY_REQUESTS,
    'Too many requests, please try again later!'
  );

  return user;
};

/**
 * Sends an email to the user to verify their email address.
 *
 * @param userId ID of existing user.
 * @param email Email address of user.
 * @returns
 */
export const sendVerificationEmail = async (email: string) => {
  const user = await verifyUserAndEmailRate(email, VerificationType.VerifyEmail);

  const emailVerificationCode = await VerificationCode.create({
    userId: user._id,
    type: VerificationType.VerifyEmail,
    expiresAt: daysFromNow(EMAIL_VER_DAYS),
  });

  const url = `${APP_ORIGIN}/email/verify/${emailVerificationCode._id}`;
  const {error} = await sendEmail({to: email, ...getVerifyEmail(url)});

  if (error) {
    console.log(error);
  }

  return {url, emailId: emailVerificationCode._id};
};

/**
 * Sends an email to the user to reset their password.
 *
 * @param email Email address of user.
 * @returns Link to the password reset page and email ID.
 */
export const forgotPassword = async (email: string) => {
  // Always show success
  try {
    const user = await verifyUserAndEmailRate(email, VerificationType.ResetPassword);

    const expiresAt = minutesFromNow(PW_RESET_MINS);
    const verificationCode = await VerificationCode.create({
      userId: user._id,
      type: VerificationType.ResetPassword,
      expiresAt,
    });

    const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;

    const {data, error} = await sendEmail({
      to: user.email,
      ...getPasswordReset(url),
    });
    appAssert(data?.id, HTTP_INTERNAL_SERVER_ERROR, `${error?.message}`);

    return {user, url, emailId: data.id};
  } catch (error: any) {
    console.log(`Failed to send password reset email: ${error.message}`);
    return {};
  }
};

type ResetPasswordParams = {
  verificationCode: string;
  password: string;
};

/**
 * Resets the user password.
 *
 * @param verificationCode Associated verification code of the reset password email.
 * @param password Password provided by the user.
 * @returns
 */
export const resetPassword = async ({verificationCode, password}: ResetPasswordParams) => {
  const validCode = await VerificationCode.findOne({
    _id: verificationCode,
    type: VerificationType.ResetPassword,
    expiresAt: {$gt: new Date()},
  });
  appAssert(validCode, HTTP_NOT_FOUND, 'Invalid or expired code!');

  // TODO: reduce to one IO call if bottleneck
  const user = await User.findById(validCode.userId);
  appAssert(user, HTTP_INTERNAL_SERVER_ERROR, 'User not found!');
  (user as any).password = password;
  await user.save();

  await validCode.deleteOne();

  await Session.deleteMany({userId: user._id.toString()});

  return {user};
};

interface LoginWithEmail {
  email: string;
  password: string;
}

interface LoginWithUsername {
  username: string;
  password: string;
}

export type LoginParams = LoginWithEmail | LoginWithUsername;

/**
 * Creates user session with tokens.
 *
 * @param user User object.
 * @returns User object, access token and refresh token.
 */
const manageLoginSessionAndSignTokens = async user => {
  if (user.markedForDeletion) {
    user.markedForDeletion = false;
    user.deletionScheduleAt = undefined;
    user.save();
  }

  // Note that all previous sessions are deleted to enforce single login constraint.
  const session = await createSession(user._id.toString());
  const {accessToken, refreshToken} = generateTokensForSession(
    user._id.toString(),
    session._id.toString()
  );

  return {user, accessToken, refreshToken};
};

/**
 * Logs the user in and manages user sesions and tokens.
 *
 * @param request Request body.
 * @returns
 */
export const loginUser = async (request: LoginParams) => {
  const user =
    'email' in request
      ? await User.findOne({email: request.email})
      : await User.findOne({username: request.username});

  appAssert(user, HTTP_UNAUTHORIZED, 'Invalid credentials!');

  const isValid = await user.comparePassword(request.password);
  appAssert(isValid, HTTP_UNAUTHORIZED, 'Invalid credentials!');

  return manageLoginSessionAndSignTokens(user);
};

/**
 * Refreshes user access token if refresh token is valid.
 * @param refreshToken User associated refresh token.
 * @returns
 */
export const refreshUserAccessToken = async (refreshToken: string) => {
  const {payload} = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, HTTP_UNAUTHORIZED, 'Invlaid refresh token!');

  const session = await Session.findById(payload.sessionId);
  appAssert(session, HTTP_UNAUTHORIZED, 'Session not found!');

  const newRefreshToken = await renewSessionIfNeeded(session);

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {accessToken, newRefreshToken};
};

// See https://www.rfc-editor.org/rfc/rfc6749#section-4.1
export const handleOAuthCallback = (strategy: OAuthType.Google | OAuthType.GitHub) =>
  catchErrors(async (req, res) => {
    passport.authenticate(strategy, {session: false}, async (err, user, info) => {
      if (err) {
        const errorMessage = encodeURIComponent(err.message);

        if (req.cookies?.accessToken) {
          return res.redirect(`${APP_ORIGIN}/profile/settings?error=${errorMessage}`);
        }
        return res.redirect(`${APP_ORIGIN}/login?error=${errorMessage}`);
      }

      if (!user) {
        return res.redirect(`${APP_ORIGIN}/login?error=oauth_failed`);
      }

      if (info?.linking) {
        return res.redirect(`${APP_ORIGIN}/profile/settings?success=${strategy}_linked`);
      }

      const {accessToken, refreshToken} = await manageLoginSessionAndSignTokens(user);

      setAuthCookies({res, accessToken, refreshToken});

      if (!user.proflileComplete) {
        return res.redirect(`${APP_ORIGIN}/complete-profile`);
      }
      return res.redirect(`${APP_ORIGIN}/`);
    })(req, res);
  });

export const unlinkOAuthProvider = async (userId, provider: OAuthType) => {
  const user = await User.findById(userId);
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');

  const {hasPassword} = user;
  const hasGoogle = !!user.googleOAuthId;
  const hasGitHub = !!user.githubOAuthId;

  const authCount = [hasPassword, hasGoogle, hasGitHub].filter(Boolean).length;

  appAssert(authCount > 1, HTTP_BAD_REQUEST, 'You need to have at least 1 login method!');
  appAssert(user[`${provider}OAuthId`], HTTP_BAD_REQUEST, 'Account not linked!');

  user[`${provider}OAuthId`] = undefined;
  user[`${provider}OAuthEmail`] = undefined;
  user[`${provider}OAuthVerified`] = undefined;

  if (user.profilePictureSource === provider) {
    user.profilePictureSource = undefined;
  }

  await user.save();
  return {user};
};
