import '../index.d';
import type {RequestHandler} from 'express';
import {HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import appAssert from '../utils/appAssert';
import {verifyToken} from '../utils/jwt';
import Session from '../models/session';
import type {AccessTokenPayload} from '../utils/jwt.ts';

/**
 * Validates user session.
 *
 * @param req Request object.
 * @param res Response object.
 * @param next Next function to be called.
 */
const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const {accessToken} = req.cookies;
    appAssert(accessToken, HTTP_UNAUTHORIZED, 'Invalid access token!');

    const {payload} = verifyToken<AccessTokenPayload>(accessToken);
    appAssert(payload, HTTP_UNAUTHORIZED, 'Invalid access token!');

    const session = await Session.findById(payload.sessionId);
    appAssert(session, HTTP_UNAUTHORIZED, 'Invalid access token!');

    appAssert(
      payload.userId === session.userId.toString(),
      HTTP_UNAUTHORIZED,
      'Invalid access token!'
    );

    req.userId = payload.userId as any;
    req.sessionId = payload.sessionId as any;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
