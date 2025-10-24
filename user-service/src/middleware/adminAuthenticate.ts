import type {RequestHandler} from 'express';
import {HTTP_FORBIDDEN, HTTP_UNAUTHORIZED} from '../constants/httpStatus.ts';
import UserRoleTypes from '../constants/userRoles.ts';
import User from '../models/user.ts';
import appAssert from '../utils/appAssert.ts';

const adminAuthenticate: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    appAssert(user, HTTP_UNAUTHORIZED, 'Unauthorized');
    appAssert(user.role === UserRoleTypes.Admin, HTTP_FORBIDDEN, 'Unauthorized');

    next();
  } catch (error) {
    next(error);
  }
};

export default adminAuthenticate;
