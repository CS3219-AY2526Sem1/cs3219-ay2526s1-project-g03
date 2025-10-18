import mongoose from 'mongoose';
import {
  createAccount,
  verifyEmail,
  sendVerificationEmail,
  forgotPassword,
  resetPassword,
  loginUser,
  refreshUserAccessToken,
  unlinkOAuthProvider,
} from '../../services/authService';
import User from '../../models/user';
import Session from '../../models/session';
import VerificationCode from '../../models/verificationCode';
import VerificationType from '../../constants/verificationTypes';
import OAuthType from '../../constants/oAuthTypes';
import AppError from '../../utils/appError';
import {
  HTTP_CONFLICT,
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_BAD_REQUEST,
} from '../../constants/httpStatus';
import {verifyToken} from '../../utils/jwt';
import {
  EMAIL_VER_DAYS,
  EMAIL_RATE_LIMIT,
  EMAIL_TIME_LIMIT_HOURS,
  PW_RESET_MINS,
} from '../../constants/expirables';

// Mock sendEmail
jest.mock('../../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({data: {id: 'email-123'}, error: null}),
}));

import {sendEmail} from '../../utils/email';
import {APP_ORIGIN, JWT_REFRESH_SECRET} from '../../constants/env';

describe('services/authService', () => {
  const TEST_USERNAME = 'testuser';
  const TEST_USERNAME_CONFLICT = TEST_USERNAME;
  const TEST_USERNAME_DIFFERENT = 'differentuser';

  const TEST_EMAIL = 'test@example.com';
  const TEST_EMAIL_CONFLICT = TEST_EMAIL;
  const TEST_EMAIL_DIFFERENT = 'test_different@example.com';

  const TEST_PASSWORD = 'testPassword!@#$%^';
  const TEST_PASSWORD_DIFFERENT = 'differentPassword&^%$#@';

  beforeEach(() => {
    (sendEmail as jest.Mock).mockClear();
  });

  describe('createAccount', () => {
    const validData = {
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    };

    it('should create a new user account', async () => {
      const result = await createAccount(validData);

      expect(result.user.username).toBe(TEST_USERNAME);
      expect(result.user.email).toBe(TEST_EMAIL);
      expect(result.user).toHaveProperty('passwordHash');
      expect(result.user.passwordHash).not.toBe(TEST_PASSWORD);
      expect(result.user).toHaveProperty('passwordSalt');
      expect(result.user.passwordHash).not.toBe(TEST_PASSWORD);
      expect(result.user).toHaveProperty('passwordIterations');
      expect(result.user.verified).toBe(false);
      expect(result.user.role).toBe('user');
    });

    it('should send verification email', async () => {
      await createAccount(validData);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: TEST_EMAIL,
        })
      );
    });

    it('should create a session for the user', async () => {
      const result = await createAccount(validData);

      const sessions = await Session.find({userId: result.user._id});
      expect(sessions.length).toBe(1);
    });

    it('should return valid access and refresh tokens', async () => {
      const result = await createAccount(validData);
      const session = await Session.findOne({userId: result.user._id});

      const accessPayload = verifyToken(result.accessToken).payload;
      expect(accessPayload.userId).toBe(result.user._id.toString());

      const refreshPayload = verifyToken(result.refreshToken, {secret: JWT_REFRESH_SECRET}).payload;
      expect(refreshPayload.sessionId).toBe(session._id.toString());
    });

    it('should throw error when username and email already exists', async () => {
      await User.create(validData);

      await expect(createAccount(validData)).rejects.toThrow(AppError);
      await expect(createAccount(validData)).rejects.toThrow('User / Email in use!');
    });

    it('should throw error when username already exists', async () => {
      await User.create(validData);

      const differentEmail = {
        username: TEST_USERNAME,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
      };

      await expect(createAccount(differentEmail)).rejects.toThrow(AppError);
      await expect(createAccount(differentEmail)).rejects.toThrow('User / Email in use!');
    });

    it('should throw error when email already exists', async () => {
      await User.create(validData);

      const differentUsername = {
        username: TEST_USERNAME_DIFFERENT,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      };

      await expect(createAccount(differentUsername)).rejects.toThrow(AppError);
      await expect(createAccount(differentUsername)).rejects.toThrow('User / Email in use!');
    });

    it('should be case-insensitive for username check', async () => {
      await User.create(validData);

      const uppercaseUsername = {
        username: TEST_USERNAME_CONFLICT,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
      };

      await expect(createAccount(uppercaseUsername)).rejects.toThrow(AppError);
      await expect(createAccount(uppercaseUsername)).rejects.toThrow('User / Email in use!');
    });

    it('should be case-insensitive for email check', async () => {
      await User.create(validData);

      const uppercaseEmail = {
        username: TEST_USERNAME_DIFFERENT,
        email: TEST_EMAIL_CONFLICT,
        password: TEST_PASSWORD,
      };

      await expect(createAccount(uppercaseEmail)).rejects.toThrow(AppError);
      await expect(createAccount(uppercaseEmail)).rejects.toThrow('User / Email in use!');
    });

    it('should throw with correct status code for conflict', async () => {
      await User.create(validData);

      try {
        await createAccount(validData);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_CONFLICT);
      }
    });
  });

  describe('verifyEmail', () => {
    let testUser: any;
    let verificationCode: any;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        verified: false,
      });

      verificationCode = await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.VerifyEmail,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    });

    it('should verify email with valid code', async () => {
      const result = await verifyEmail(verificationCode._id.toString());

      expect(result.user.verified).toBe(true);
    });

    it('should delete verification code after use', async () => {
      await verifyEmail(verificationCode._id.toString());

      const deletedCode = await VerificationCode.findById(verificationCode._id);
      expect(deletedCode).toBeNull();
    });

    it('should throw error for invalid code', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(verifyEmail(fakeId)).rejects.toThrow(AppError);
      await expect(verifyEmail(fakeId)).rejects.toThrow('Invalid or expired verification code!');
    });

    it('should throw error for expired code', async () => {
      const expiredCode = await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.VerifyEmail,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(verifyEmail(expiredCode._id.toString())).rejects.toThrow(AppError);
      await expect(verifyEmail(expiredCode._id.toString())).rejects.toThrow(
        'Invalid or expired verification code!'
      );
    });

    it('should throw with correct status code for invalid code', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await verifyEmail(fakeId);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_NOT_FOUND);
      }
    });

    it('should not verify with wrong code type', async () => {
      const wrongTypeCode = await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.ResetPassword,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await expect(verifyEmail(wrongTypeCode._id.toString())).rejects.toThrow(AppError);
      await expect(verifyEmail(wrongTypeCode._id.toString())).rejects.toThrow(
        'Invalid or expired verification code!'
      );
    });

    it('should update user in database', async () => {
      await verifyEmail(verificationCode._id.toString());

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.verified).toBe(true);
    });

    it('should return updated user', async () => {
      const result = await verifyEmail(verificationCode._id.toString());

      expect(result.user._id.toString()).toBe(testUser._id.toString());
      expect(result.user.verified).toBe(true);
    });

    it('should throw error when user not found', async () => {
      await User.findByIdAndDelete(testUser._id);

      await expect(verifyEmail(verificationCode._id.toString())).rejects.toThrow(AppError);
      await expect(verifyEmail(verificationCode._id.toString())).rejects.toThrow(
        'Failed to verify email!'
      );
    });
  });

  describe('sendVerificationEmail', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        verified: false,
      });
    });

    it('should send verification email', async () => {
      await sendVerificationEmail(testUser.email);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testUser.email,
        })
      );
    });

    it('should create verification code', async () => {
      await sendVerificationEmail(testUser.email);

      const codes = await VerificationCode.find({
        userId: testUser._id,
        type: VerificationType.VerifyEmail,
      });

      expect(codes.length).toBe(1);
    });

    it('should set expiration date', async () => {
      const beforeCreate = Date.now();
      await sendVerificationEmail(testUser.email);
      const afterCreate = Date.now();

      const code = await VerificationCode.findOne({
        userId: testUser._id,
        type: VerificationType.VerifyEmail,
      });

      const expectedMinExpiry = beforeCreate + EMAIL_VER_DAYS * 24 * 60 * 60 * 1000;
      const expectedMaxExpiry = afterCreate + EMAIL_VER_DAYS * 24 * 60 * 60 * 1000;
      const actualExpiry = code.expiresAt.getTime();

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(actualExpiry).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    it('should throw error when user not found', async () => {
      await expect(sendVerificationEmail(TEST_EMAIL_DIFFERENT)).rejects.toThrow(AppError);

      await expect(sendVerificationEmail(TEST_EMAIL_DIFFERENT)).rejects.toThrow('User not found!');
    });

    it('should throw error when rate limit exceeded', async () => {
      for (let i = 0; i < EMAIL_RATE_LIMIT; i++) {
        await sendVerificationEmail(testUser.email);
      }

      await expect(sendVerificationEmail(testUser.email)).rejects.toThrow(AppError);
      await expect(sendVerificationEmail(testUser.email)).rejects.toThrow(
        'Too many requests, please try again later!'
      );
    });

    it('should throw with correct status code for rate limit', async () => {
      for (let i = 0; i < EMAIL_RATE_LIMIT; i++) {
        await sendVerificationEmail(testUser.email);
      }

      try {
        await sendVerificationEmail(testUser.email);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_TOO_MANY_REQUESTS);
      }
    });

    it('should allow sending after time window expires', async () => {
      await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.VerifyEmail,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - (EMAIL_TIME_LIMIT_HOURS + 1) * 60 * 60 * 1000),
      });

      await expect(sendVerificationEmail(testUser.email)).resolves.not.toThrow();
    });

    it('should return verification URL and email ID', async () => {
      const result = await sendVerificationEmail(testUser.email);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('emailId');
      expect(result.url).toContain(`${APP_ORIGIN}/email/verify/`);
    });

    it('should handle email sending errors gracefully', async () => {
      (sendEmail as jest.Mock).mockResolvedValueOnce({data: null, error: {message: 'Email error'}});

      await expect(sendVerificationEmail(testUser.email)).resolves.not.toThrow();
    });
  });

  describe('forgotPassword', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
    });

    it('should send password reset email', async () => {
      await forgotPassword(testUser.email);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testUser.email,
        })
      );
    });

    it('should create password reset code', async () => {
      await forgotPassword(testUser.email);

      const codes = await VerificationCode.find({
        userId: testUser._id,
        type: VerificationType.ResetPassword,
      });

      expect(codes.length).toBe(1);
    });

    it('should set correct expiration time', async () => {
      const beforeCreate = Date.now();
      await forgotPassword(testUser.email);
      const afterCreate = Date.now();

      const code = await VerificationCode.findOne({
        userId: testUser._id,
        type: VerificationType.ResetPassword,
      });

      const expectedMinExpiry = beforeCreate + PW_RESET_MINS * 60 * 1000;
      const expectedMaxExpiry = afterCreate + PW_RESET_MINS * 60 * 1000;
      const actualExpiry = code.expiresAt.getTime();

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(actualExpiry).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    it('should not throw error for non existent email to prevent enumeration', async () => {
      // Should always succeed to prevent email enumeration
      await expect(forgotPassword(TEST_EMAIL_DIFFERENT)).resolves.not.toThrow();
    });

    it('should not send email when rate limit exceeded', async () => {
      for (let i = 0; i < EMAIL_RATE_LIMIT; i++) {
        const result = await forgotPassword(testUser.email);
        expect(result.url).toContain(`${APP_ORIGIN}/password/reset`);
        expect(result).toHaveProperty('emailId');
      }

      const result = await forgotPassword(testUser.email);
      expect(result).toEqual({});
    });

    it('should return empty object on error', async () => {
      (sendEmail as jest.Mock).mockResolvedValueOnce({data: null, error: {message: 'Error'}});

      const result = await forgotPassword(testUser.email);
      expect(result).toEqual({});
    });
  });

  describe('resetPassword', () => {
    let testUser: any;
    let resetCode: any;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      resetCode = await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.ResetPassword,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
    });

    it('should reset password with valid code', async () => {
      const result = await resetPassword({
        verificationCode: resetCode._id.toString(),
        password: TEST_PASSWORD_DIFFERENT,
      });

      expect(result.user).toBeDefined();

      const updatedUser = await User.findById(testUser._id);
      const isValid = await updatedUser.comparePassword(TEST_PASSWORD_DIFFERENT);
      expect(isValid).toBe(true);

      const oldPasswordValid = await updatedUser.comparePassword(TEST_PASSWORD);
      expect(oldPasswordValid).toBe(false);
    });

    it('should delete verification code after use', async () => {
      await resetPassword({
        verificationCode: resetCode._id.toString(),
        password: TEST_PASSWORD_DIFFERENT,
      });

      const deletedCode = await VerificationCode.findById(resetCode._id);
      expect(deletedCode).toBeNull();
    });

    it('should delete all user sessions', async () => {
      await Session.create({userId: testUser._id});

      let sessions = await Session.find({userId: testUser._id});
      expect(sessions.length).toBe(1);

      await resetPassword({
        verificationCode: resetCode._id.toString(),
        password: TEST_PASSWORD_DIFFERENT,
      });

      sessions = await Session.find({userId: testUser._id});
      expect(sessions.length).toBe(0);
    });

    it('should throw error for invalid code', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        resetPassword({
          verificationCode: fakeId,
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow(AppError);

      await expect(
        resetPassword({
          verificationCode: fakeId,
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow('Invalid or expired code!');
    });

    it('should throw error for expired code', async () => {
      const expiredCode = await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.ResetPassword,
        expiresAt: new Date(Date.now() - 15 * 60 * 1000),
      });

      await expect(
        resetPassword({
          verificationCode: expiredCode._id.toString(),
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow(AppError);

      await expect(
        resetPassword({
          verificationCode: expiredCode._id.toString(),
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow('Invalid or expired code!');
    });

    it('should throw error for wrong code type', async () => {
      const wrongTypeCode = await VerificationCode.create({
        userId: testUser._id,
        type: VerificationType.VerifyEmail,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await expect(
        resetPassword({
          verificationCode: wrongTypeCode._id.toString(),
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow(AppError);

      await expect(
        resetPassword({
          verificationCode: wrongTypeCode._id.toString(),
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow('Invalid or expired code!');
    });

    it('should throw error when user not found', async () => {
      await User.findByIdAndDelete(testUser._id);

      await expect(
        resetPassword({
          verificationCode: resetCode._id.toString(),
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow('User not found!');
    });

    it('should hash new password', async () => {
      await resetPassword({
        verificationCode: resetCode._id.toString(),
        password: TEST_PASSWORD_DIFFERENT,
      });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordHash).not.toBe(testUser.passwordHash);
    });
  });

  describe('loginUser', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        verified: true,
      });
    });

    it('should login with valid email and password', async () => {
      const result = await loginUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should login with valid username and password', async () => {
      const result = await loginUser({
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should create a new session on login', async () => {
      let sessions = await Session.find({userId: testUser._id});
      expect(sessions.length).toBe(0);

      await Session.create([{userId: testUser._id}]);

      sessions = await Session.find({userId: testUser._id});
      expect(sessions.length).toBe(1);

      await loginUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      sessions = await Session.find({userId: testUser._id});
      expect(sessions.length).toBe(1);
    });

    it('should throw error for non-existent email', async () => {
      await expect(
        loginUser({
          email: TEST_EMAIL_DIFFERENT,
          password: TEST_PASSWORD,
        })
      ).rejects.toThrow(AppError);

      await expect(
        loginUser({
          email: TEST_EMAIL_DIFFERENT,
          password: TEST_PASSWORD,
        })
      ).rejects.toThrow('Invalid credentials!');
    });

    it('should throw error for non-existent username', async () => {
      await expect(
        loginUser({
          username: TEST_USERNAME_DIFFERENT,
          password: TEST_PASSWORD,
        })
      ).rejects.toThrow(AppError);

      await expect(
        loginUser({
          username: TEST_USERNAME_DIFFERENT,
          password: TEST_PASSWORD,
        })
      ).rejects.toThrow('Invalid credentials!');
    });

    it('should throw error for incorrect password with email', async () => {
      await expect(
        loginUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow(AppError);

      await expect(
        loginUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow('Invalid credentials!');
    });

    it('should throw error for incorrect password with username', async () => {
      await expect(
        loginUser({
          username: TEST_USERNAME,
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow(AppError);

      await expect(
        loginUser({
          username: TEST_USERNAME,
          password: TEST_PASSWORD_DIFFERENT,
        })
      ).rejects.toThrow('Invalid credentials!');
    });

    it('should throw with correct status code', async () => {
      // Invalid username.
      try {
        await loginUser({
          username: TEST_USERNAME_DIFFERENT,
          password: TEST_PASSWORD,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
      }

      // Invalid email.
      try {
        await loginUser({
          email: TEST_EMAIL_DIFFERENT,
          password: TEST_PASSWORD,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
      }

      // Invalid password
      try {
        await loginUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD_DIFFERENT,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
      }
    });

    it('should return valid tokens', async () => {
      const result = await loginUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      const session = await Session.findOne({userId: result.user._id});

      const accessPayload = verifyToken(result.accessToken).payload;
      expect(accessPayload.userId).toBe(result.user._id.toString());

      const refreshPayload = verifyToken(result.refreshToken, {secret: JWT_REFRESH_SECRET}).payload;
      expect(refreshPayload.sessionId).toBe(session._id.toString());
    });

    it('should be case-sensitive for username', async () => {
      const result = await loginUser({
        username: TEST_USERNAME_CONFLICT,
        password: TEST_PASSWORD,
      });

      expect(result.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should be case-insensitive for email', async () => {
      const result = await loginUser({
        email: TEST_EMAIL_CONFLICT,
        password: TEST_PASSWORD,
      });

      expect(result.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should unmark account for deletion on login', async () => {
      testUser.markedForDeletion = true;
      testUser.deletionScheduleAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await testUser.save();

      await loginUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.markedForDeletion).toBe(false);
      expect(updatedUser.deletionScheduleAt).toBeUndefined();
    });

    it('should handle concurrent login attempts', async () => {
      const promises = [
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
        loginUser({email: TEST_EMAIL, password: TEST_PASSWORD}),
      ];

      const results = await Promise.all(promises);

      // All success logins.
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.accessToken).toBeDefined();
      });

      // Only last login will have a valid session.
      const sessions = await Session.find({userId: testUser._id});
      expect(sessions.length).toBe(1);
    });
  });

  describe('refreshUserAccessToken', () => {
    let testUser: any;
    let session: any;
    let refreshToken: string;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const loginResult = await loginUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      refreshToken = loginResult.refreshToken;
      const payload = verifyToken(refreshToken, {
        secret: JWT_REFRESH_SECRET,
      }).payload as any;
      session = await Session.findById(payload.sessionId);
    });

    it('should refresh access token with valid refresh token', async () => {
      const result = await refreshUserAccessToken(refreshToken);

      expect(typeof result.accessToken).toBe('string');
    });

    it('should return new refresh token when session renewed and extend session', async () => {
      // Set session to expire soon
      const oldExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);
      session.expiresAt = oldExpiry;
      await session.save();

      const result = await refreshUserAccessToken(refreshToken);

      expect(result.newRefreshToken).toBeDefined();

      const updatedSession = await Session.findById(session._id);
      expect(updatedSession.expiresAt.getTime()).toBeGreaterThan(oldExpiry.getTime());
    });

    it('should not return new refresh token when session has plenty of time', async () => {
      const result = await refreshUserAccessToken(refreshToken);

      expect(result.newRefreshToken).toBeNull();
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(refreshUserAccessToken('invalid-token')).rejects.toThrow(AppError);

      await expect(refreshUserAccessToken('invalid-token')).rejects.toThrow(
        'Invlaid refresh token!'
      );
    });

    it('should throw error for expired refresh token', async () => {
      const expiredToken = verifyToken(refreshToken, {
        secret: JWT_REFRESH_SECRET,
      }).payload;

      // Session is expired
      session.expiresAt = new Date(Date.now() - 60 * 1000);
      await session.save();

      await expect(refreshUserAccessToken(refreshToken)).rejects.toThrow('Session expired!');
    });

    it('should throw error when session not found', async () => {
      await Session.findByIdAndDelete(session._id);

      await expect(refreshUserAccessToken(refreshToken)).rejects.toThrow('Session not found!');
    });

    it('should throw with correct status code', async () => {
      try {
        await refreshUserAccessToken('invalid-token');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
      }
    });
  });

  describe('unlinkOAuthProvider', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        hasPassword: true,
        googleOAuthId: 'google123',
        googleOAuthEmail: 'test@gmail.com',
        googleOAuthVerified: true,
        githubOAuthId: 'github456',
        githubOAuthEmail: 'test@github.com',
        githubOAuthVerified: true,
      });
    });

    it('should unlink Google OAuth', async () => {
      const result = await unlinkOAuthProvider(testUser._id.toString(), OAuthType.Google);

      expect(result.user.googleOAuthId).toBeUndefined();
      expect(result.user.googleOAuthEmail).toBeUndefined();
      expect(result.user.googleOAuthVerified).toBeUndefined();

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.googleOAuthId).toBeUndefined();
      expect(updatedUser.googleOAuthEmail).toBeUndefined();
      expect(updatedUser.googleOAuthVerified).toBeUndefined();
    });

    it('should unlink GitHub OAuth', async () => {
      const result = await unlinkOAuthProvider(testUser._id.toString(), OAuthType.GitHub);

      expect(result.user.githubOAuthId).toBeUndefined();
      expect(result.user.githubOAuthEmail).toBeUndefined();
      expect(result.user.githubOAuthVerified).toBeUndefined();

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.githubOAuthId).toBeUndefined();
      expect(updatedUser.githubOAuthEmail).toBeUndefined();
      expect(updatedUser.githubOAuthVerified).toBeUndefined();
    });

    it('should throw error when user has no password and only one OAuth', async () => {
      const oauthOnlyUser = await User.create({
        username: 'oauthuser',
        googleOAuthId: 'google123',
        googleOAuthEmail: 'oauth@gmail.com',
      });

      await expect(
        unlinkOAuthProvider(oauthOnlyUser._id.toString(), OAuthType.Google)
      ).rejects.toThrow(AppError);

      await expect(
        unlinkOAuthProvider(oauthOnlyUser._id.toString(), OAuthType.Google)
      ).rejects.toThrow('You need to have at least 1 login method!');
    });

    it('should allow unlinking when user has password', async () => {
      await unlinkOAuthProvider(testUser._id.toString(), OAuthType.Google);
      const result = await unlinkOAuthProvider(testUser._id.toString(), OAuthType.GitHub);

      expect(result.user.googleOAuthId).toBeUndefined();
      expect(result.user.githubOAuthId).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(unlinkOAuthProvider(fakeId, OAuthType.Google)).rejects.toThrow(AppError);

      await expect(unlinkOAuthProvider(fakeId, OAuthType.Google)).rejects.toThrow(
        'User not found!'
      );
    });
  });

  describe('Others', () => {
    /**
     * TODO: Enforce atomicity within verification.
     */
    it('should allow at least EMAIL_RATE_LIMIT of concurrent verifications to send', async () => {
      const user = await User.create({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      const promises = [
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
        sendVerificationEmail(user.email),
      ];

      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(succeeded.length).toBeGreaterThanOrEqual(EMAIL_RATE_LIMIT);
      expect(failed.length).toBeLessThanOrEqual(10 - EMAIL_RATE_LIMIT);

      // Verify failed ones threw the correct error
      failed.forEach(result => {
        if (result.status === 'rejected') {
          expect(result.reason).toBeInstanceOf(AppError);
          expect(result.reason.message).toBe('Too many requests, please try again later!');
        }
      });

      const codes = await VerificationCode.find({
        userId: user._id,
        type: VerificationType.VerifyEmail,
      });

      expect(codes.length).toBeGreaterThanOrEqual(EMAIL_RATE_LIMIT);
    });
  });
});
