import crypto from 'crypto';
import {HTTP_CONFLICT, HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_OK} from '../constants/httpStatus.ts';
import {ADMIN_EMAIL, ADMIN_USERNAME, APP_ORIGIN} from '../constants/env.ts';
import VerificationType from '../constants/verificationTypes.ts';
import User from '../models/user.ts';
import VerificationCode from '../models/verificationCode.ts';
import appAssert from '../utils/appAssert.ts';
import catchErrors from '../utils/catchErrors.ts';
import {minutesFromNow} from '../utils/date.ts';
import {sendEmail} from '../utils/email.ts';
import {changeRoleSchema, usernameAndEmail} from './userSchema.ts';
import {PW_RESET_MINS} from '../constants/expirables.ts';
import {getPasswordReset} from '../utils/verifyTemplate.ts';

export const changeUserRoleController = catchErrors(async (req, res) => {
  const {username} = req.params;
  const request = changeRoleSchema.parse(req.body);

  const user = await User.findOne({username}).collation({locale: 'en', strength: 2});
  appAssert(user, HTTP_NOT_FOUND, 'User not found');

  const isSeedAdmin = user.username === ADMIN_USERNAME || user.email === ADMIN_EMAIL;
  appAssert(!isSeedAdmin, HTTP_FORBIDDEN, 'Unauthorized');

  user.role = request.role;
  await user.save();

  return res.status(HTTP_OK).json({
    message: 'User role updated successfully',
  });
});

export const createAdminAccountController = catchErrors(async (req, res) => {
  const request = usernameAndEmail.parse(req.body);

  const existingUsername = await User.findOne({username: request.username}).collation({
    locale: 'en',
    strength: 2,
  });
  appAssert(!existingUsername, HTTP_CONFLICT, 'Username already in use');

  const existingEmail = await User.findOne({email: request.email}).collation({
    locale: 'en',
    strength: 2,
  });
  appAssert(!existingEmail, HTTP_CONFLICT, 'Email already in use');

  const dummyPassword = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    username: request.username,
    email: request.email,
    password: dummyPassword,
    role: 'admin',
    verified: true,
    profileComplete: false,
    markedForDeletion: false,
  });

  const expiresAt = minutesFromNow(PW_RESET_MINS);
  const verificationCode = await VerificationCode.create({
    userId: user._id,
    type: VerificationType.ResetPassword,
    expiresAt,
  });

  const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;

  const {error} = await sendEmail({
    to: user.email,
    ...getPasswordReset(url),
  });
  if (error) {
    console.error('Failed to send password reset email:', error);
  }

  return res.status(HTTP_OK).json({
    message: 'Admin account created successfully. Password reset email sent.',
  });
});
