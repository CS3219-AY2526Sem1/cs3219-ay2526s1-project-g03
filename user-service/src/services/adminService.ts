import * as crypto from 'crypto';
import {ADMIN_EMAIL, ADMIN_USERNAME} from '../constants/env.ts';
import {HTTP_CONFLICT, HTTP_FORBIDDEN, HTTP_NOT_FOUND} from '../constants/httpStatus.ts';
import UserRoleTypes from '../constants/userRoles.ts';
import User from '../models/user.ts';
import appAssert from '../utils/appAssert.ts';
import {forgotPassword} from './authService.ts';

/**
 * Change user role.
 *
 * @param username Username of existing user.
 * @param role New role of user.
 * @returns
 */
export const changeUserRole = async (
  username: string,
  role: typeof UserRoleTypes.Admin | typeof UserRoleTypes.User
) => {
  const user = await User.findOne({username}).collation({locale: 'en', strength: 2});
  appAssert(user, HTTP_NOT_FOUND, 'User not found');

  const isSeedAdmin = user.username === ADMIN_USERNAME || user.email === ADMIN_EMAIL;
  appAssert(!isSeedAdmin, HTTP_FORBIDDEN, 'Unauthorized');

  user.role = role;
  await user.save();
  return user;
};

/**
 * Creates a new admin account.
 *
 * @param username Username of new user.
 * @param email Email address of new user.
 * @returns
 */
export const createAdminAccount = async (username: string, email: string) => {
  const existingUsername = await User.findOne({username}).collation({locale: 'en', strength: 2});
  appAssert(!existingUsername, HTTP_CONFLICT, 'Username already in use');

  const existingEmail = await User.findOne({email}).collation({locale: 'en', strength: 2});
  appAssert(!existingEmail, HTTP_CONFLICT, 'Email already in use');

  const dummyPassword = crypto.randomBytes(32).toString('hex');

  await User.create({
    username,
    email,
    password: dummyPassword,
    role: 'admin',
    verified: true,
    profileComplete: false,
    markedForDeletion: false,
  });

  const {user, url, emailId} = await forgotPassword(email);
  return {user, url, emailId};
};
