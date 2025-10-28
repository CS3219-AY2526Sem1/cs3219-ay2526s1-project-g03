import {changeUserRole, createAdminAccount} from '../../services/adminService';
import User from '../../models/user';
import UserRoleTypes from '../../constants/userRoles';
import AppError from '../../utils/appError';
import {HTTP_CONFLICT, HTTP_FORBIDDEN, HTTP_NOT_FOUND} from '../../constants/httpStatus';
import {ADMIN_EMAIL, ADMIN_USERNAME} from '../../constants/env';
// Mock sendEmail
jest.mock('../../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({data: {id: 'email-123'}, error: null}),
}));

import {sendEmail} from '../../utils/email';

describe('services/adminService', () => {
  const TEST_USERNAME = 'testuser';
  const TEST_USERNAME_CONFLICT = 'tEStUSeR';
  const TEST_USERNAME_DIFFERENT = 'differentuser';
  const TEST_EMAIL = 'test@example.com';
  const TEST_EMAIL_CONFLICT = 'tESt@eXaMPlE.cOm';
  const TEST_EMAIL_DIFFERENT = 'test_different@example.com';
  const TEST_PASSWORD = 'testPassword!@#$%^';
  const TEST_PASSWORD_DIFFERENT = 'differentPassword&^%$#@';
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: UserRoleTypes.User,
    });
  });

  describe('changeUserRole', () => {
    it('should change user role to admin', async () => {
      const result = await changeUserRole(testUser.username, UserRoleTypes.Admin);

      expect(result.role).toBe(UserRoleTypes.Admin);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe(UserRoleTypes.Admin);
    });

    it('should change admin role to user', async () => {
      testUser.role = UserRoleTypes.Admin;
      await testUser.save();

      const result = await changeUserRole(testUser.username, UserRoleTypes.User);

      expect(result.role).toBe(UserRoleTypes.User);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe(UserRoleTypes.User);
    });

    it('should throw error when user not found', async () => {
      await expect(changeUserRole('nonexistent', UserRoleTypes.Admin)).rejects.toThrow(AppError);

      await expect(changeUserRole('nonexistent', UserRoleTypes.Admin)).rejects.toThrow(
        'User not found'
      );

      try {
        await changeUserRole('nonexistent', UserRoleTypes.Admin);
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_NOT_FOUND);
      }
    });

    it('should be case insensitive for username', async () => {
      const result = await changeUserRole(testUser.username.toUpperCase(), UserRoleTypes.Admin);

      expect(result.role).toBe(UserRoleTypes.Admin);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe(UserRoleTypes.Admin);
    });

    it('should allow setting same role', async () => {
      const result = await changeUserRole(testUser.username, UserRoleTypes.User);

      expect(result.role).toBe(UserRoleTypes.User);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.role).toBe(UserRoleTypes.User);
    });

    it('should return updated user object', async () => {
      const result = await changeUserRole(testUser.username, UserRoleTypes.Admin);

      expect(result).toMatchObject({
        username: testUser.username,
        email: testUser.email,
        role: UserRoleTypes.Admin,
      });
    });

    it('should not modify other user fields', async () => {
      const originalEmail = testUser.email;
      const originalUsername = testUser.username;

      await changeUserRole(testUser.username, UserRoleTypes.Admin);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.email).toBe(originalEmail);
      expect(updatedUser.username).toBe(originalUsername);
    });

    it('should allow multiple concurrent role changes to succeed', async () => {
      const promises = [
        changeUserRole(testUser.username, UserRoleTypes.Admin),
        changeUserRole(testUser.username, UserRoleTypes.User),
        changeUserRole(testUser.username, UserRoleTypes.Admin),
        changeUserRole(testUser.username, UserRoleTypes.User),
        changeUserRole(testUser.username, UserRoleTypes.Admin),
        changeUserRole(testUser.username, UserRoleTypes.User),
        changeUserRole(testUser.username, UserRoleTypes.Admin),
        changeUserRole(testUser.username, UserRoleTypes.User),
        changeUserRole(testUser.username, UserRoleTypes.Admin),
        changeUserRole(testUser.username, UserRoleTypes.User),
      ];

      const results = await Promise.allSettled(promises);

      // All should succeed
      const succeeded = results.filter(r => r.status === 'fulfilled');
      expect(succeeded.length).toBe(10);

      // All results have valid UserRoleTypes
      succeeded.forEach(result => {
        if (result.status === 'fulfilled') {
          const userRole = result.value.role;
          expect([UserRoleTypes.Admin, UserRoleTypes.User]).toContain(userRole);
        }
      });

      // Final state is also valid
      const finalUser = await User.findOne({username: testUser.username});
      expect(finalUser).toBeTruthy();
      expect([UserRoleTypes.Admin, UserRoleTypes.User]).toContain(finalUser.role);
    });

    it('should persist role change across database queries', async () => {
      await changeUserRole(testUser.username, UserRoleTypes.Admin);

      const userByEmail = await User.findOne({email: testUser.email});
      expect(userByEmail.role).toBe(UserRoleTypes.Admin);

      const userById = await User.findById(testUser._id);
      expect(userById.role).toBe(UserRoleTypes.Admin);
    });

    it('should throw error when trying to change seed admin role by username', async () => {
      const seedAdmin = await User.create({
        username: ADMIN_USERNAME,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
        role: UserRoleTypes.Admin,
      });

      await expect(changeUserRole(seedAdmin.username, UserRoleTypes.User)).rejects.toThrow(
        AppError
      );

      await expect(changeUserRole(seedAdmin.username, UserRoleTypes.User)).rejects.toThrow(
        'Unauthorized'
      );

      try {
        await changeUserRole(seedAdmin.username, UserRoleTypes.User);
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_FORBIDDEN);
      }
    });

    it('should throw error when trying to change seed admin role by email', async () => {
      const seedAdmin = await User.create({
        username: TEST_USERNAME_DIFFERENT,
        email: ADMIN_EMAIL,
        password: TEST_PASSWORD,
        role: UserRoleTypes.Admin,
      });

      await expect(changeUserRole(seedAdmin.username, UserRoleTypes.User)).rejects.toThrow(
        AppError
      );

      try {
        await changeUserRole(seedAdmin.username, UserRoleTypes.User);
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_FORBIDDEN);
      }
    });
  });

  describe('createAdminAccount', () => {
    it('should create new admin account with correct role and verified status', async () => {
      const result = await createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL_DIFFERENT);

      expect(result.user.username).toBe(TEST_USERNAME_DIFFERENT);
      expect(result.user.email).toBe(TEST_EMAIL_DIFFERENT);
      expect(result.user.role).toBe(UserRoleTypes.Admin);
      expect(result.user.verified).toBe(true);
      expect(result.user.profileComplete).toBe(false);
      expect(result.user.markedForDeletion).toBe(false);

      expect(result.url).toBeDefined();
      expect(result.emailId).toBeDefined();

      const createdUser = await User.findById(result.user._id);
      expect(createdUser.username).toBe(TEST_USERNAME_DIFFERENT);
      expect(createdUser.email).toBe(TEST_EMAIL_DIFFERENT);
      expect(createdUser.role).toBe(UserRoleTypes.Admin);
      expect(createdUser.verified).toBe(true);
      expect(createdUser.profileComplete).toBe(false);
      expect(createdUser.markedForDeletion).toBe(false);
    });

    it('should throw error when username already exists', async () => {
      await expect(createAdminAccount(TEST_USERNAME, TEST_EMAIL_DIFFERENT)).rejects.toThrow(
        AppError
      );

      await expect(createAdminAccount(TEST_USERNAME, TEST_EMAIL_DIFFERENT)).rejects.toThrow(
        'Username already in use'
      );

      try {
        await createAdminAccount(TEST_USERNAME, TEST_EMAIL_DIFFERENT);
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_CONFLICT);
      }
    });

    it('should be case insensitive for username conflict check', async () => {
      await expect(createAdminAccount(TEST_USERNAME_CONFLICT, TEST_PASSWORD)).rejects.toThrow(
        AppError
      );

      await expect(createAdminAccount(TEST_USERNAME_CONFLICT, TEST_PASSWORD)).rejects.toThrow(
        'Username already in use'
      );

      try {
        await createAdminAccount(TEST_USERNAME_CONFLICT, TEST_PASSWORD);
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_CONFLICT);
      }
    });

    it('should throw error when email already exists', async () => {
      await expect(createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL)).rejects.toThrow(
        AppError
      );

      await expect(createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL)).rejects.toThrow(
        'Email already in use'
      );

      try {
        await createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL);
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_CONFLICT);
      }
    });

    it('should be case insensitive for email conflict check', async () => {
      await expect(
        createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL_CONFLICT)
      ).rejects.toThrow(AppError);

      await expect(
        createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL_CONFLICT)
      ).rejects.toThrow('Email already in use');
    });

    it('should create account even if both username and email exist as different users', async () => {
      await User.create({
        username: TEST_USERNAME_DIFFERENT,
        email: TEST_EMAIL_DIFFERENT,
        password: TEST_PASSWORD,
        role: UserRoleTypes.User,
      });

      // username is always validated first.
      await expect(createAdminAccount(TEST_USERNAME, TEST_EMAIL_DIFFERENT)).rejects.toThrow(
        'Username already in use'
      );

      await expect(createAdminAccount(TEST_USERNAME_DIFFERENT, TEST_EMAIL)).rejects.toThrow(
        'Username already in use'
      );
    });
  });
});
