import {HTTP_BAD_REQUEST, HTTP_OK} from '../constants/httpStatus';
import OAuthType from '../constants/oAuthTypes';
import Session from '../models/session';
import {unlinkOAuthProvider} from '../services/authService';
import {
  findUserById,
  markAccountFordeletion,
  updatePassword,
  updatePersonalInfo,
  updateProfilePicture,
  updateUsernameOrEmail,
} from '../services/userService';
import {getOtherUser} from '../services/userService';
import appAssert from '../utils/appAssert';
import AppError from '../utils/appError';
import catchErrors from '../utils/catchErrors';
import {clearAuthCookies} from '../utils/cookies';
import {processProfilePicture} from '../utils/imageProcessor';
import {
  changePersonalInfoSchema,
  changePwSchema,
  changeUsernameOrEmailSchema,
  setPwSchema,
} from './userSchema';

/**
 * Gets existing user.
 */
export const getUserController = catchErrors(async (req, res) => {
  const user = await findUserById(req.userId);
  return res.status(HTTP_OK).json(user.toJSON());
});

export const getOtherUserController = catchErrors(async (req, res) => {
  const {userId} = req.params;
  const result = await getOtherUser(userId);
  return res.status(HTTP_OK).json(result);
});

/**
 * Changes username and/or password of existing user.
 */
export const changeUsernameOrEmailController = catchErrors(async (req, res) => {
  const request = changeUsernameOrEmailSchema.parse(req.body);
  await updateUsernameOrEmail(req.userId, request);
  return res.status(HTTP_OK).json({
    message: 'Profile updated successfully',
  });
});

/**
 * Changes profile picture of existing user.
 */
export const changeProfilePictureController = catchErrors(async (req, res) => {
  if (req.body.delete === 'true') {
    await updateProfilePicture(req.userId, null);
    return res.status(HTTP_OK).json({
      message: 'Profile picture removed successfully!',
    });
  }

  if (!req.file) {
    throw new AppError(HTTP_BAD_REQUEST, 'No file uploaded');
  }

  const processedImage = await processProfilePicture(req.file.buffer);
  await updateProfilePicture(req.userId, processedImage);
  return res.status(HTTP_OK).json({
    message: 'Profile picture updated successfully!',
  });
});

/**
 * Changes password for users with existing passwords.
 * Alternatively, sets password for user without existing password.
 */
export const changePasswordHandler = catchErrors(async (req, res) => {
  const user = await findUserById(req.userId);

  let password;
  let currentPassword = '';

  if (user.hasPassword) {
    const parsed = changePwSchema.parse(req.body);
    password = parsed.password;
    currentPassword = parsed.currentPassword;
  } else {
    const parsed = setPwSchema.parse(req.body);
    password = parsed.password;
  }

  await updatePassword(req.userId, password, currentPassword);

  // No need to delete sessions because this should only be the only session running
  return res.status(HTTP_OK).json({
    message: 'Password reset successful!',
  });
});

/**
 * Changes personal information of existing user.
 */
export const changePersonalInfoController = catchErrors(async (req, res) => {
  const request = changePersonalInfoSchema.parse(req.body);

  await updatePersonalInfo(req.userId, request);
  return res.status(HTTP_OK).json({
    message: 'Personal information updated successfully',
  });
});

export const markAccountForDeletionController = catchErrors(async (req, res) => {
  const {password} = req.body;
  appAssert(password, HTTP_BAD_REQUEST, 'Password is required!');
  const {days} = await markAccountFordeletion(req.userId, password);

  await Session.deleteMany({userId: req.userId});

  return clearAuthCookies(res)
    .status(HTTP_OK)
    .json({
      message: `Account marked for deletion. 
      You have ${days} days to cancel by logging in`,
    });
});

/**
 * Unlinks OAuth from existing user.
 */
export const unlinkOAuthController = catchErrors(async (req, res) => {
  const {provider} = req.params;

  appAssert(
    provider === OAuthType.Google || provider === OAuthType.GitHub,
    HTTP_BAD_REQUEST,
    'Invalid provider!'
  );

  const {user} = await unlinkOAuthProvider(req.userId, provider);
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  return res.status(HTTP_OK).json({
    message: `${providerName} account unlinked!`,
    user,
  });
});
