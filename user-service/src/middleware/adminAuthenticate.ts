import type {RequestHandler} from 'express';
import {HTTP_FORBIDDEN, HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import UserRoleTypes from '../constants/userRoles';
import User from '../models/user';
import appAssert from '../utils/appAssert';

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
