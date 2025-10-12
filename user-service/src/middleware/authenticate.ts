import type {RequestHandler} from 'express';
import {HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import appAssert from '../utils/appAssert';
import {verifyToken} from '../utils/jwt';
import Session from '../models/session';

const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const {accessToken} = req.cookies;
    appAssert(accessToken, HTTP_UNAUTHORIZED, 'Invalid access token!');

    const {payload} = verifyToken(accessToken);
    appAssert(payload, HTTP_UNAUTHORIZED, 'Invalid access token!');

    const session = await Session.findById(payload.sessionId);
    appAssert(session, HTTP_UNAUTHORIZED, 'Invalid access token!');

    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
