import type {SignOptions, VerifyOptions} from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import {JWT_REFRESH_SECRET, JWT_SECRET} from '../constants/env';
import {ACCESS_TOKEN_MINS, REFRESH_TOKEN_DAYS} from '../constants/expirables';
import JwtAudience from '../constants/jwtAudience';
import {ISession} from '../models/session';
import {IUser} from '../models/user';

// Adapted from https://github.com/nikitapryymak/mern-auth-jwt/blob/youtube/backend/src/utils/jwt.ts

export type RefreshTokenPayload = {
  sessionId: ISession['_id'];
};

export type AccessTokenPayload = {
  userId: IUser['_id'];
  sessionId: ISession['_id'];
};

type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

const defaults: SignOptions = {
  audience: [JwtAudience.User],
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: `${REFRESH_TOKEN_DAYS}d`,
  secret: JWT_REFRESH_SECRET,
};

export const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: `${ACCESS_TOKEN_MINS}m`,
  secret: JWT_SECRET,
};

/**
 * Signs a JWT token with the provided payload and options.
 * Defaults to access token configuration if no options are provided.
 *
 * @param payload Token payload containing session and/or user information.
 * @param options Optional sign options and secret. Defaults to access token settings.
 * @returns A signed JWT token string.
 */
export const signToken = (
  payload: RefreshTokenPayload | AccessTokenPayload,
  options?: SignOptionsAndSecret
) => {
  const {secret, ...signOptions} = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...signOptions,
  });
};

/**
 * Verifies a JWT token and returns its payload or an error message.
 * Defaults to access token verification if no options are provided.
 *
 * @param token JWT token string to verify.
 * @param options Optional verify options and secret. Defaults to access token secret.
 * @returns An object containing either the decoded payload or an error message.
 */
export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & {
    secret?: string;
  }
) => {
  const {secret = JWT_SECRET, ...verifyOptions} = options || {};
  try {
    const payload = jwt.verify(token, secret, {
      ...defaults,
      ...verifyOptions,
    } as VerifyOptions) as TPayload;
    return {
      payload,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};
