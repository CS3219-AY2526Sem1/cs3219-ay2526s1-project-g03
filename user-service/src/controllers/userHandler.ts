import {APP_ORIGIN} from '../constants/env.ts';
import {ACCOUNT_DELETION_DAYS, EMAIL_VER_DAYS} from '../constants/expirables.ts';
import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
} from '../constants/httpStatus.ts';
import VerificationType from '../constants/verificationTypes.ts';
import Session from '../models/session.ts';
import User from '../models/user.ts';
import VerificationCode from '../models/verificationCode.ts';
import appAssert from '../utils/appAssert.ts';
import AppError from '../utils/appError.ts';
import catchErrors from '../utils/catchErrors.ts';
import {clearAuthCookies} from '../utils/cookies.ts';
import {daysFromNow} from '../utils/date.ts';
import {sendEmail} from '../utils/email.ts';
import {processProfilePicture} from '../utils/imageProcessor.ts';
import {getVerifyEmail} from '../utils/verifyTemplate.ts';
import {
  changePersonalInfoSchema,
  changePwSchema,
  changeUsernameOrEmailSchema,
} from './userSchema.ts';

const getUser = async (req, res) => {
  const user = await User.findById(req.userId);
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');

  return user;
};

export const getUserController = catchErrors(async (req, res) => {
  const user = await getUser(req, res);
  return res.status(HTTP_OK).json(user);
});

export const changeUsernameOrEmailController = catchErrors(async (req, res) => {
  const request = changeUsernameOrEmailSchema.parse(req.body);

  const conditions = [];
  const update = {};
  if (request.username) {
    conditions.push({username: request.username});
    update.username = request.username;
  }
  if (request.email) {
    conditions.push({email: request.email});
    update.email = request.email;
    update.verified = false;
  }

  const existingUser = await User.findOne({
    $and: [{_id: {$ne: req.userId}}, {$or: conditions}],
  }).collation({locale: 'en', strength: 2});
  appAssert(!existingUser, HTTP_CONFLICT, 'Username or email already in use!');

  const user = await User.findByIdAndUpdate(
    req.userId,
    {$set: update},
    {new: true, runValidators: true}
  );
  appAssert(user, HTTP_NOT_FOUND, 'User update failed!');

  if (request.email) {
    // Generate verification code.
    const emailVerificationCode = await VerificationCode.create({
      userId: user._id,
      type: VerificationType.VerifyEmail,
      expiresAt: daysFromNow(EMAIL_VER_DAYS),
    });

    // Send verification email.
    const url = `${APP_ORIGIN}/email/verify/${emailVerificationCode._id}`;
    const {error} = await sendEmail({to: user.email, ...getVerifyEmail(url)});

    if (error) {
      console.log(error);
    }
  }

  return res.status(HTTP_OK).json({
    message: 'Profile updated successfully',
    user,
  });
});

export const changeProfilePictureController = catchErrors(async (req, res) => {
  if (!req.file) {
    throw new AppError(HTTP_BAD_REQUEST, 'No file uploaded');
  }

  const processedImage = await processProfilePicture(req.file.buffer);

  const user = await User.findByIdAndUpdate(
    req.userId,
    {$set: {profilePicture: processedImage}},
    {new: true, runValidators: true}
  );
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');

  return res.status(HTTP_OK).json({
    message: 'Profile picture updated successfully!',
  });
});

export const changePasswordHandler = catchErrors(async (req, res) => {
  const {currentPassword, password} = changePwSchema.parse(req.body);

  const user = await getUser(req, res);

  const isValid = await user.comparePassword(currentPassword);
  appAssert(isValid, HTTP_UNAUTHORIZED, 'Current password is incorrect');

  user.password = password;
  await user.save();

  // No need to delete sessions because this should only be the only session running
  return res.status(HTTP_OK).json({
    message: 'Password reset successful!',
  });
});

export const changePersonalInfoController = catchErrors(async (req, res) => {
  const request = changePersonalInfoSchema.parse(req.body);

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $set: {
        firstName: request.firstName,
        lastName: request.lastName,
        occupation: request.occupation,
        areaOfStudy: request.areaOfStudy,
        profileComplete: true,
      },
    },
    {new: true, runValidators: true}
  );
  appAssert(user, HTTP_NOT_FOUND, 'User update failed!');

  return res.status(HTTP_OK).json({
    message: 'Personal information updated successfully',
    user,
  });
});

export const markAccountForDeletionController = catchErrors(async (req, res) => {
  const {password} = req.body;
  appAssert(password, HTTP_BAD_REQUEST, 'Password is required!');

  const user = await getUser(req, res);

  const isValid = await user.comparePassword(password);
  appAssert(isValid, HTTP_UNAUTHORIZED, 'Incorrect password!');

  user.markedForDeletion = true;
  user.deletionScheduleAt = daysFromNow(ACCOUNT_DELETION_DAYS);
  await user.save();

  await Session.deleteMany({userId: user._id});

  return clearAuthCookies(res)
    .status(HTTP_OK)
    .json({
      message: `Account marked for deletion. You have ${ACCOUNT_DELETION_DAYS} days to cancel by logging in`,
    });
});
