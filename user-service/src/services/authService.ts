import {APP_ORIGIN} from '../constants/env';
import {HTTP_INTERNAL_SERVER_ERROR, HTTP_NOT_FOUND} from '../constants/httpStatus';
import VerificationType from '../constants/verificationTypes';
import User from '../models/user';
import VerificationCode from '../models/verificationCode';
import appAssert from '../utils/appAssert';
import {oneDay} from '../utils/date';
import {sendEmail} from '../utils/email';
import {getVerifyEmail} from '../utils/verifyTemplate';

export type CreateAccoutParams = {
  username: string;
  email: string;
  password: string;
};

export const createAccount = async (data: CreateAccoutParams) => {
  // Check if user exists.
  const existingUser = await User.exists({
    $or: [{email: data.email}, {username: data.username}],
  }).collation({locale: 'en', strength: 2});

  if (existingUser) {
    throw new Error('User already exists!');
  }

  // Create user.
  const user = await User.create({
    username: data.username,
    email: data.email,
    password: data.password,
  });

  // Generate verification code.
  const emailVerificationCode = await VerificationCode.create({
    userId: user._id,
    type: VerificationType.VerifyEmail,
    expiresAt: oneDay(),
  });

  // Send verification email.
  const url = `${APP_ORIGIN}/email/verify/${emailVerificationCode._id}`;
  const {error} = await sendEmail({to: user.email, ...getVerifyEmail(url)});

  if (error) {
    console.log(error);
  }

  return user;
};

export const verifyEmail = async (code: string) => {
  const validCode = await VerificationCode.findOne({
    _id: code,
    type: VerificationType.VerifyEmail,
    expiresAt: {$gt: new Date()},
  });
  appAssert(validCode, HTTP_NOT_FOUND, 'Invalid or expired verification code!');

  const updatedUser = await User.findByIdAndUpdate(validCode.userId, {verified: true}, {new: true});
  appAssert(updatedUser, HTTP_INTERNAL_SERVER_ERROR, 'Failed to verify email!');

  await validCode.deleteOne();

  return {
    user: updatedUser,
  };
};
