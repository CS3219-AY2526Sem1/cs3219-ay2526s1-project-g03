import * as jose from 'jose';

import {JWT_SECRET} from '../config/config';

type AccessTokenPayload = {
  userId: string;
  sessionId: string;
};

export async function verifyToken<TPayload extends object = AccessTokenPayload>(token: string) {
  try {
    const decoded = await jose.jwtVerify(token, JWT_SECRET);
    return {valid: true, payload: decoded.payload as TPayload & jose.JWTPayload};
  } catch (error) {
    return {valid: false, error: error};
  }
}
