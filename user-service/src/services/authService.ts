import {APP_ORIGIN} from '../constants/env';
import {
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_CONFLICT,
} from '../constants/httpStatus';
import VerificationType from '../constants/verificationTypes';
import Session from '../models/session';
import User from '../models/user';
import VerificationCode from '../models/verificationCode';
import appAssert from '../utils/appAssert';
import {daysFromNow} from '../utils/date';
import {sendEmail} from '../utils/email';
import {getVerifyEmail} from '../utils/verifyTemplate';
import {
  refreshTokenSignOptions,
  signToken,
  verifyToken,
  type RefreshTokenPayload,
} from '../utils/jwt';
import {EMAIL_VER_DAYS, REFRESH_BUFFER_DAYS, REFRESH_TOKEN_DAYS} from '../constants/expirables';
import {hoursAgo, minutesFromNow} from '../utils/date.ts';
import {EMAIL_RATE_LIMIT, EMAIL_TIME_LIMIT_HOURS, PW_RESET_MINS} from '../constants/expirables.ts';
import {HTTP_BAD_REQUEST, HTTP_TOO_MANY_REQUESTS} from '../constants/httpStatus.ts';
import {getPasswordReset} from '../utils/verifyTemplate.ts';
import OAuthType from '../constants/oAuthTypes.ts';
import catchErrors from '../utils/catchErrors.ts';
import passport from 'passport';
import {setAuthCookies} from '../utils/cookies.ts';
import {usernameAndEmail} from '../controllers/userSchema.ts';

export type CreateAccoutParams = {
  username: string;
  email: string;
  password: string;
};

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

  // Generate verification code.
  const emailVerificationCode = await VerificationCode.create({
    userId: user._id,
    type: VerificationType.VerifyEmail,
    expiresAt: daysFromNow(EMAIL_VER_DAYS),
  });

  // Send verification email.
  const url = `${APP_ORIGIN}/email/verify/${emailVerificationCode._id}`;
  const {error} = await sendEmail({to: user.email, ...getVerifyEmail(url)});

  if (error) {
    console.log(error);
  }

  const userId = user._id;

  const session = await Session.create({
    userId,
  });

  const sessionId = session._id;

  const refreshToken = signToken(
    {
      sessionId,
    },
    refreshTokenSignOptions
  );

  const accessToken = signToken({
    userId,
    sessionId,
  });

  return {user, accessToken, refreshToken};
};

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

const verifyUserAndEmailRate = async (email: string, type: VerificationType) => {
  const user = await User.findOne({email});
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');

  const count = await VerificationCode.countDocuments({
    userId: user._id,
    type,
    createdAt: {$gt: hoursAgo(EMAIL_TIME_LIMIT_HOURS)},
  });
  appAssert(
    count < EMAIL_RATE_LIMIT,
    HTTP_TOO_MANY_REQUESTS,
    'Too many requests, please try again later!'
  );

  return user;
};

export const resendEmail = async (email: string) => {
  const user = await verifyUserAndEmailRate(email, VerificationType.VerifyEmail);

  const emailVerificationCode = await VerificationCode.create({
    userId: user._id,
    type: VerificationType.VerifyEmail,
    expiresAt: daysFromNow(EMAIL_VER_DAYS),
  });

  // Send verification email.
  const url = `${APP_ORIGIN}/email/verify/${emailVerificationCode._id}`;
  const {data, error} = await sendEmail({to: user.email, ...getVerifyEmail(url)});
  if (error) {
    console.log(error);
  }
  return {url, emailId: data.id};
};

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

    return {url, emailId: data.id};
  } catch (error: any) {
    console.log(`forgotPassword error: ${error.message}`);
    return {};
  }
};

type ResetPasswordParams = {
  verificationCode: string;
  password: string;
};

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
  user.password = password;
  await user.save();

  await validCode.deleteOne();

  await Session.deleteMany({
    userId: user._id,
  });

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

const manageLoginSessionAndSignTokens = async user => {
  const userId = user._id;

  if (user.markedForDeletion) {
    user.markedForDeletion = false;
    user.deletionScheduleAt = undefined;
    user.save();
  }

  // Delete all previous sessions to enforce single login constraint.
  await Session.deleteMany({userId});
  const session = await Session.create({
    userId,
  });

  const sessionInfo: RefreshTokenPayload = {
    sessionId: session._id,
  };

  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  const accessToken = signToken({
    ...sessionInfo,
    userId,
  });

  return {user, accessToken, refreshToken};
};

export const loginUser = async (request: LoginParams) => {
  const user =
    'email' in request
      ? await User.findOne({email: request.email})
      : await User.findOne({username: request.username});

  appAssert(user, HTTP_UNAUTHORIZED, 'Invalid credentials!');

  const isValid = await user.comparePassword(request.password);
  appAssert(isValid, HTTP_UNAUTHORIZED, 'Invalid credentials!');

  return await manageLoginSessionAndSignTokens(user);
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

export const refreshUserAccessToken = async (refreshToken: string) => {
  const {payload} = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, HTTP_UNAUTHORIZED, 'Invlaid refresh token!');

  const session = await Session.findById(payload.sessionId);
  appAssert(session, HTTP_UNAUTHORIZED, 'Session not found!');

  const sessionExpiry = session.expiresAt.getTime();
  const now = Date.now();
  appAssert(sessionExpiry > now, HTTP_UNAUTHORIZED, 'Session expired!');

  let newRefreshToken;

  if (sessionExpiry - now <= daysFromNow(REFRESH_BUFFER_DAYS)) {
    session.expiresAt = daysFromNow(REFRESH_TOKEN_DAYS);
    await session.save();

    newRefreshToken = signToken({sessionId: session._id}, refreshTokenSignOptions);
  }

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {accessToken, newRefreshToken};
};

export const unlinkOAuthProvider = async (userId, provider: OAuthType) => {
  const user = await User.findById(userId);
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');

  const hasPassword = !!user.verified;
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
