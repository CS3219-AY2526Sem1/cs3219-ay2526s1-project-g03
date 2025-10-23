import {REFRESH_BUFFER_DAYS, REFRESH_TOKEN_DAYS} from '../constants/expirables.ts';
import {HTTP_UNAUTHORIZED} from '../constants/httpStatus.ts';
import Session from '../models/session.ts';
import appAssert from '../utils/appAssert.ts';
import {daysFromNow} from '../utils/date.ts';
import {refreshTokenSignOptions, signToken, type RefreshTokenPayload} from '../utils/jwt.ts';

/**
 * Creates a user session.
 *
 * @param userId Expected ID of user.
 * @returns a Session object.
 */
export const createSession = async (userId: string) => {
  await Session.deleteMany({userId});
  const session = await Session.create({userId});
  return session;
};

/**
 * Deletes all user sessions.
 *
 * @param userId Expected ID of user.
 */
export const deleteUserSessions = async (userId: string) => {
  await Session.deleteMany({userId});
};

/**
 * Deletes a particular session.
 *
 * @param sessionId ID of session to be deleted.
 */
export const deleteSession = async (sessionId: string) => {
  await Session.findByIdAndDelete(sessionId);
};

/**
 * Generates an access and refresh token.
 *
 * @param userId Expected ID of user.
 * @param sessionId Current session ID.
 * @returns
 */
export const generateTokensForSession = (userId: string, sessionId: string) => {
  const sessionInfo: RefreshTokenPayload = {sessionId};
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
