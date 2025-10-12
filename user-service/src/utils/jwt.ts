import jwt from 'jsonwebtoken';
import type {VerifyOptions, SignOptions} from 'jsonwebtoken';
import type {SessionModel} from '../models/session';
import type {User} from '../models/user';
import {JWT_REFRESH_SECRET, JWT_SECRET} from '../constants/env';

export type RefreshTokenPayload = {
  sessionId: SessionModel['_id'];
};

export type AccessTokenPayload = {
  userId: User['_id'];
  sessionId: SessionModel['_id'];
};

type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

const defaults: SignOptions = {
  audience: ['user'],
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: '30d',
  secret: JWT_REFRESH_SECRET,
};

export const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: '15m',
  secret: JWT_SECRET,
};

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
    }) as TPayload;
    return {
      payload,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};
