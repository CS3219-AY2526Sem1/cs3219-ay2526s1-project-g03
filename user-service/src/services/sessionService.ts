import {REFRESH_BUFFER_DAYS, REFRESH_TOKEN_DAYS} from '../constants/expirables';
import {HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import Session from '../models/session';
import appAssert from '../utils/appAssert';
import {daysFromNow} from '../utils/date';
import {refreshTokenSignOptions, signToken, type RefreshTokenPayload} from '../utils/jwt';

/**
 * Creates a user session.
 *
 * @param userId Expected ID of user.
 * @returns a Session object.
 */
export const createSession = async (userId: string) => {
  const session = await Session.findOneAndUpdate(
    {userId},
    {
      $set: {
        userId,
        createdAt: new Date(),
        expiresAt: daysFromNow(REFRESH_TOKEN_DAYS),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
  return session;
};

/**
 * Generates an access and refresh token.
 *
 * @param userId Expected ID of user.
 * @param sessionId Current session ID.
 * @returns
 */
export const generateTokensForSession = (userId: string, sessionId: string) => {
  const refreshToken = signToken({sessionId}, refreshTokenSignOptions);
  const accessToken = signToken({userId, sessionId});
  return {accessToken, refreshToken};
};

/**
 * Checks if new refresh token is required for existing session.
 *
 * @param session Session object.
 * @returns New refresh token, else null.
 */
export const renewSessionIfNeeded = async (session: any) => {
  const sessionExpiry = new Date(session.expiresAt).getTime();
  const now = Date.now();
  appAssert(sessionExpiry > now, HTTP_UNAUTHORIZED, 'Session expired!');

  if (sessionExpiry <= daysFromNow(REFRESH_BUFFER_DAYS).getTime()) {
    session.expiresAt = daysFromNow(REFRESH_TOKEN_DAYS);
    await session.save();
    return signToken({sessionId: session._id}, refreshTokenSignOptions);
  }
  return null;
};
