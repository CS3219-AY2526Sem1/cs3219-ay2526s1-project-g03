import mongoose from 'mongoose';
import {ACCOUNT_DELETION_DAYS} from '../constants/expirables';
import {HTTP_CONFLICT, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED} from '../constants/httpStatus';
import User from '../models/user';
import appAssert from '../utils/appAssert';
import {daysFromNow} from '../utils/date';
import {sendVerificationEmail} from './authService';

/**
 * Finds an existing user by their ID.
 *
 * @param userId Expected ID of user.
 * @returns User object.
 */
export const findUserById = async (userId: string) => {
  const user = await User.findById(userId);
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');
  return user;
};

/**
 * Retrieves public profile information for a specific user.
 * 
 * @param userId MondoDB ObjectId of the user to retrieve
 * @returns Public user profile information
 */
export const getOtherUser = async (userId: string) => {
  const user = await User.findById(userId)
    .select('username firstName lastName occupation areaOfStudy profilePicture')
    .lean();

  appAssert(user, HTTP_NOT_FOUND, 'User not found!');
  return user;
}

/**
 * Helper method. Checks if username or email to be changed is provided
 * and does not conflict with any existing users.
 *
 * @param username New username.
 * @param email New password.
 * @param excludeUserId
 */
export const checkUsernameOrEmailExists = async (
  username?: string,
  email?: string,
  excludeUserId?: string
) => {
  const conditions = [];
  if (username) conditions.push({username});
  if (email) conditions.push({email});

  const query: any = {$or: conditions};
  if (excludeUserId) {
    query._id = {$ne: excludeUserId};
  }

  const existingUser = await User.findOne(query).collation({locale: 'en', strength: 2});
  appAssert(!existingUser, HTTP_CONFLICT, 'Username or email already in use!');
};

/**
 * Updates user's username and/or email.
 *
 * @param userId Expected ID of existing user.
 * @param data New username and/or email.
 * @returns User object.
 */
export const updateUsernameOrEmail = async (
  userId: string,
  data: {username?: string; email?: string}
) => {
  await checkUsernameOrEmailExists(data.username, data.email, userId);

  const update: any = {};
  if (data.username) update.username = data.username;
  if (data.email) {
    update.email = data.email;
    update.verified = false;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {$set: update},
    {new: true, runValidators: true}
  );
  appAssert(user, HTTP_NOT_FOUND, 'User update failed!');

  if (data.email) {
    await sendVerificationEmail(user.email);
  }

  return user;
};

/**
 * Updates user profile picture
 *
 * @param userId Expected ID of user.
 * @param profilePicture New profile picture.
 * @returns User object.
 */
export const updateProfilePicture = async (userId: string, profilePicture: string) => {
  let user;

  if (profilePicture) {
    user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          profilePicture,
          profilePictureSource: 'upload',
        },
      },
      {new: true, runValidators: true}
    );
  } else {
    user = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          profilePicture: '',
          profilePictureSource: '',
        },
      },
      {new: true, runValidators: true}
    );
  }
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');
  return user;
};

/**
 * Updates user password.
 *
 * @param userId Expected ID of user.
 * @param newPassword New password to be set.
 * @param currentPassword Existing password confirmation provided by user.
 * @returns User object.
 */
export const updatePassword = async (
  userId: string,
  newPassword: string,
  currentPassword: string
) => {
  const user = await findUserById(userId);

  if (user.hasPassword) {
    const isValid = await user.comparePassword(currentPassword);
    appAssert(isValid, HTTP_UNAUTHORIZED, 'Current password is incorrect');
  }

  (user as any).password = newPassword;
  await user.save();
  return user;
};

/**
 * Updates user personal information.
 *
 * @param userId Expected ID of user.
 * @param data User's personal information.
 * @returns User object.
 */
export const updatePersonalInfo = async (
  userId: string,
  data: {firstName: string; lastName: string; occupation: string; areaOfStudy: string}
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        ...data,
        profileComplete: true,
      },
    },
    {new: true, runValidators: true}
  );
  appAssert(user, HTTP_NOT_FOUND, 'User update failed!');
  return user;
};

/**
 * Marks a user account for deletion.
 *
 * @param userId Expected ID of user.
 * @param password Password provided by user.
 * @returns User object.
 */
export const markAccountFordeletion = async (userId: string, password: string) => {
  const user = await findUserById(userId);
  const isValid = await user.comparePassword(password);
  appAssert(isValid, HTTP_UNAUTHORIZED, 'Incorrect password!');

  user.markedForDeletion = true;
  user.deletionScheduleAt = daysFromNow(ACCOUNT_DELETION_DAYS);
  await user.save();

  return {user, days: ACCOUNT_DELETION_DAYS};
};
