import type {RequestHandler} from 'express';
import {HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import appAssert from '../utils/appAssert';
import {verifyToken} from '../utils/jwt';

const authenticate: RequestHandler = (req, res, next) => {
  const {accessToken} = req.cookies;
  appAssert(accessToken, HTTP_UNAUTHORIZED, 'Not authorized!');

  const {payload} = verifyToken(accessToken);
  appAssert(payload, HTTP_UNAUTHORIZED, 'Invalid token!');

  req.userId = payload.userId;
  req.sessionId = payload.sessionId;
  next();
};

export default authenticate;
