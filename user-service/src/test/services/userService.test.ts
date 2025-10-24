import mongoose from 'mongoose';
import {ACCOUNT_DELETION_DAYS} from '../../constants/expirables';
import {HTTP_CONFLICT, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED} from '../../constants/httpStatus';
import User from '../../models/user';
import {
  checkUsernameOrEmailExists,
  findUserById,
  markAccountFordeletion,
  updatePassword,
  updatePersonalInfo,
  updateProfilePicture,
  updateUsernameOrEmail,
} from '../../services/userService';
import AppError from '../../utils/appError';

jest.mock('../../services/authService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({url: 'http://test.com', emailId: '123'}),
}));

import {sendVerificationEmail} from '../../services/authService';

describe('services/userService', () => {
  let testUser;
  let testUser2;
  let testUserId;
  let testUser2Id;

  const TEST_USERNAME = 'testuser';
  const TEST_USERNAME_DIFFERENT = 'differentuser';
  const TEST_USERNAME_CONFLICT = 'tEStUSeR';
  const TEST_USERNAME_AVAILABLE = 'availableuser';

  const TEST_EMAIL = 'test@example.com';
  const TEST_EMAIL_CONFLICT = 'tESt@eXaMPlE.cOm';
  const TEST_EMAIL_DIFFERENT = 'test_different@example.com';
  const TEST_EMAIL_AVAILABLE = 'available@example.com';

  const TEST_PASSWORD = 'testPassword!@#$%^';
  const TEST_PASSWORD_DIFFERENT = 'differentPassword&^%$#@';

  const TEST_FIRSTNAME = 'John';
  const TEST_LASTNAME = 'Doe';
  const TEST_OCCUPATION = 'information-technology';
  const TEST_AREAOFSTUDY = 'computer-science';

  const TEST_PROF_PIC_LINK = 'https://example.com/pic.jpg';
  const TEST_PROF_PIC_BASE64 = 'data:image/jpeg;base64, /9j/2woRAYgewoP/9k=';

  beforeEach(async () => {
    testUser = await User.create({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      verified: true,
    });
    testUserId = testUser._id.toString();

    testUser2 = await User.create({
      username: TEST_USERNAME_DIFFERENT,
      email: TEST_EMAIL_DIFFERENT,
      password: TEST_PASSWORD,
      verified: true,
    });
    testUser2Id = testUser2._id.toString();

    (sendVerificationEmail as jest.Mock).mockClear();
  });

  describe('findUserById', () => {
    it('should find existing user by ID', async () => {
      const user = await findUserById(testUserId);

      expect(user).toBeDefined();
      expect(user._id.toString()).toBe(testUserId);
      expect(user.username).toBe(TEST_USERNAME);
    });

    it('should throw error for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(findUserById(fakeId)).rejects.toThrow(AppError);
      await expect(findUserById(fakeId)).rejects.toThrow('User not found!');
    });

    it('should throw error with correct status code', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      try {
        await findUserById(fakeId);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_NOT_FOUND);
      }
    });

    it('should return user with all fields', async () => {
      testUser.firstName = TEST_FIRSTNAME;
      testUser.lastName = TEST_LASTNAME;
      await testUser.save();

      const user = await findUserById(testUserId);

      expect(user.username).toBe(TEST_USERNAME);
      expect(user.email).toBe(TEST_EMAIL);
      expect(user.verified).toBe(true);
      expect(user.firstName).toBe(TEST_FIRSTNAME);
      expect(user.lastName).toBe(TEST_LASTNAME);
    });

    it('should handle invalid ID format', async () => {
      await expect(findUserById('invalid-id')).rejects.toThrow();
    });
  });

  describe('checkUsernameOrEmailExists', () => {
    it('should not throw when username is available', async () => {
      await expect(checkUsernameOrEmailExists(TEST_USERNAME_AVAILABLE)).resolves.not.toThrow();
    });

    it('should not throw when email is available', async () => {
      await expect(
        checkUsernameOrEmailExists(undefined, TEST_EMAIL_AVAILABLE)
      ).resolves.not.toThrow();
    });

    it('should throw when username exists', async () => {
      await expect(checkUsernameOrEmailExists(TEST_USERNAME)).rejects.toThrow(AppError);

      await expect(checkUsernameOrEmailExists(TEST_USERNAME)).rejects.toThrow(
        'Username or email already in use!'
      );
    });

    it('should throw when email exists', async () => {
      await expect(checkUsernameOrEmailExists(undefined, TEST_EMAIL)).rejects.toThrow(AppError);

      await expect(checkUsernameOrEmailExists(undefined, TEST_EMAIL)).rejects.toThrow(
        'Username or email already in use!'
      );
    });

    it('should be case-insensitive for username', async () => {
      await expect(checkUsernameOrEmailExists(TEST_USERNAME_CONFLICT)).rejects.toThrow(AppError);

      await expect(checkUsernameOrEmailExists(TEST_USERNAME_CONFLICT)).rejects.toThrow(
        'Username or email already in use!'
      );
    });

    it('should be case-insensitive for email', async () => {
      await expect(checkUsernameOrEmailExists(undefined, TEST_EMAIL_CONFLICT)).rejects.toThrow(
        AppError
      );

      await expect(checkUsernameOrEmailExists(undefined, TEST_EMAIL_CONFLICT)).rejects.toThrow(
        'Username or email already in use!'
      );
    });

    it('should throw with correct status code', async () => {
      try {
        await checkUsernameOrEmailExists(TEST_USERNAME);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_CONFLICT);
      }
    });

    it('should exclude specified user ID from check', async () => {
      const user = await User.findOne({username: TEST_USERNAME});

      await expect(
        checkUsernameOrEmailExists(TEST_USERNAME, undefined, user._id.toString())
      ).resolves.not.toThrow();
    });

    it('should throw when username taken by another user', async () => {
      const user = await User.findOne({username: TEST_USERNAME});

      await expect(
        checkUsernameOrEmailExists(TEST_USERNAME_DIFFERENT, undefined, user._id.toString())
      ).rejects.toThrow(AppError);
    });

    it('should check both username and email', async () => {
      // username available, but email is not.
      await expect(checkUsernameOrEmailExists(TEST_USERNAME_AVAILABLE, TEST_EMAIL)).rejects.toThrow(
        AppError
      );

      // username is not available but email is.
      await expect(checkUsernameOrEmailExists(TEST_USERNAME, TEST_EMAIL_AVAILABLE)).rejects.toThrow(
        AppError
      );
    });

    it('should not throw when both are available', async () => {
      await expect(
        checkUsernameOrEmailExists(TEST_USERNAME_AVAILABLE, TEST_EMAIL_AVAILABLE)
      ).resolves.not.toThrow();
    });
  });

  describe('updateUsernameOrEmail', () => {
    it('should update username', async () => {
      const updatedUser = await updateUsernameOrEmail(testUserId, {
        username: TEST_USERNAME_AVAILABLE,
      });

      expect(updatedUser.username).toBe(TEST_USERNAME_AVAILABLE);
      expect(updatedUser.email).toBe(TEST_EMAIL);
      expect(updatedUser.verified).toBe(true);
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should update email', async () => {
      const updatedUser = await updateUsernameOrEmail(testUserId, {
        email: TEST_EMAIL_AVAILABLE,
      });

      expect(updatedUser.email).toBe(TEST_EMAIL_AVAILABLE);
      expect(updatedUser.username).toBe(TEST_USERNAME);
      expect(updatedUser.verified).toBe(false);
      expect(sendVerificationEmail).toHaveBeenCalledWith(TEST_EMAIL_AVAILABLE);
    });

    it('should update both username and email', async () => {
      const updatedUser = await updateUsernameOrEmail(testUserId, {
        username: TEST_USERNAME_AVAILABLE,
        email: TEST_EMAIL_AVAILABLE,
      });

      expect(updatedUser.username).toBe(TEST_USERNAME_AVAILABLE);
      expect(updatedUser.email).toBe(TEST_EMAIL_AVAILABLE);
      expect(updatedUser.verified).toBe(false);
      expect(sendVerificationEmail).toHaveBeenCalledWith(TEST_EMAIL_AVAILABLE);
    });

    it('should throw when username already taken', async () => {
      await expect(
        updateUsernameOrEmail(testUserId, {username: TEST_USERNAME_DIFFERENT})
      ).rejects.toThrow(AppError);
    });

    it('should throw when email already taken', async () => {
      await expect(
        updateUsernameOrEmail(testUserId, {email: TEST_EMAIL_DIFFERENT})
      ).rejects.toThrow(AppError);
    });

    it('should throw when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        updateUsernameOrEmail(fakeId, {username: TEST_USERNAME_AVAILABLE})
      ).rejects.toThrow(AppError);

      await expect(
        updateUsernameOrEmail(fakeId, {username: TEST_USERNAME_AVAILABLE})
      ).rejects.toThrow('User update failed!');
    });

    it('should allow updating to same username (case change)', async () => {
      const updatedUser = await updateUsernameOrEmail(testUserId, {
        username: TEST_USERNAME_CONFLICT,
      });

      expect(updatedUser.username).toBe(TEST_USERNAME_CONFLICT);
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture with URL', async () => {
      const pictureUrl = TEST_PROF_PIC_LINK;
      const updatedUser = await updateProfilePicture(testUserId, pictureUrl);

      expect(updatedUser.profilePicture).toBe(pictureUrl);
      expect(updatedUser.profilePictureSource).toBe('upload');
    });

    it('should update profile picture with base64', async () => {
      const base64Image = TEST_PROF_PIC_BASE64;
      const updatedUser = await updateProfilePicture(testUserId, base64Image);

      expect(updatedUser.profilePicture).toBe(base64Image);
      expect(updatedUser.profilePictureSource).toBe('upload');
    });

    it('should remove profile picture when null provided', async () => {
      testUser.profilePicture = TEST_PROF_PIC_LINK;
      testUser.profilePictureSource = 'upload';
      await testUser.save();

      const updatedUser = await updateProfilePicture(testUserId, null as any);

      expect(updatedUser.profilePicture).toBeUndefined();
      expect(updatedUser.profilePictureSource).toBeUndefined();
    });

    it('should remove profile picture when empty string provided', async () => {
      testUser.profilePicture = TEST_PROF_PIC_LINK;
      testUser.profilePictureSource = 'upload';
      await testUser.save();

      const updatedUser = await updateProfilePicture(testUserId, '');

      expect(updatedUser.profilePicture).toBeUndefined();
      expect(updatedUser.profilePictureSource).toBeUndefined();
    });

    it('should throw when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(updateProfilePicture(fakeId, TEST_PROF_PIC_LINK)).rejects.toThrow(AppError);

      await expect(updateProfilePicture(fakeId, TEST_PROF_PIC_LINK)).rejects.toThrow(
        'User not found!'
      );
    });

    it('should overwrite existing profile picture', async () => {
      testUser.profilePicture = TEST_PROF_PIC_BASE64;
      await testUser.save();

      const updatedUser = await updateProfilePicture(testUserId, TEST_PROF_PIC_LINK);

      expect(updatedUser.profilePicture).toBe(TEST_PROF_PIC_LINK);
    });
  });

  describe('updatePassword', () => {
    it('should update password for user with existing password', async () => {
      const updatedUser = await updatePassword(testUserId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD);

      expect(updatedUser).toBeDefined();

      const isValid = await updatedUser.comparePassword(TEST_PASSWORD_DIFFERENT);
      expect(isValid).toBe(true);
    });

    it('should throw when current password is incorrect', async () => {
      await expect(
        updatePassword(testUserId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD_DIFFERENT)
      ).rejects.toThrow(AppError);

      await expect(
        updatePassword(testUserId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD_DIFFERENT)
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw with correct status code for wrong password', async () => {
      try {
        await updatePassword(testUserId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD_DIFFERENT);
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
      }
    });

    it('should set password for user without existing password', async () => {
      const oauthUser = await User.create({
        username: TEST_USERNAME_AVAILABLE,
      });

      expect(oauthUser.hasPassword).toBe(false);

      const updatedUser = await updatePassword(oauthUser._id.toString(), TEST_PASSWORD, '');

      expect(updatedUser.hasPassword).toBe(true);

      const isValid = await updatedUser.comparePassword(TEST_PASSWORD);
      expect(isValid).toBe(true);
    });

    it('should throw when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(updatePassword(fakeId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD)).rejects.toThrow(
        AppError
      );

      await expect(updatePassword(fakeId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD)).rejects.toThrow(
        'User not found!'
      );
    });

    it('should hash the new password', async () => {
      const updatedUser = await updatePassword(testUserId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD);

      // Hashing tests should have been done in user.
      expect(updatedUser.passwordHash).toBeDefined();
      expect(updatedUser.passwordHash).not.toBe(TEST_PASSWORD_DIFFERENT);
    });

    it('should invalidate old password', async () => {
      await updatePassword(testUserId, TEST_PASSWORD_DIFFERENT, TEST_PASSWORD);

      const user = await User.findById(testUserId);
      const oldPasswordValid = await user.comparePassword(TEST_PASSWORD);

      expect(oldPasswordValid).toBe(false);
    });
  });

  describe('updatePersonalInfo', () => {
    const personalInfo = {
      firstName: TEST_FIRSTNAME,
      lastName: TEST_LASTNAME,
      occupation: TEST_OCCUPATION,
      areaOfStudy: TEST_AREAOFSTUDY,
    };

    it('should update all personal information fields', async () => {
      expect(testUser.profileComplete).toBe(false);
      const updatedUser = await updatePersonalInfo(testUserId, personalInfo);

      expect(updatedUser.firstName).toBe(TEST_FIRSTNAME);
      expect(updatedUser.lastName).toBe(TEST_LASTNAME);
      expect(updatedUser.occupation).toBe(TEST_OCCUPATION);
      expect(updatedUser.areaOfStudy).toBe(TEST_AREAOFSTUDY);
      expect(updatedUser.profileComplete).toBe(true);
    });

    it('should throw when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(updatePersonalInfo(fakeId, personalInfo)).rejects.toThrow(AppError);

      await expect(updatePersonalInfo(fakeId, personalInfo)).rejects.toThrow('User update failed!');
    });

    it('should overwrite existing personal information', async () => {
      await updatePersonalInfo(testUserId, personalInfo);

      const updatedUser = await updatePersonalInfo(testUserId, {
        firstName: 'Jane',
        lastName: 'Smith',
        occupation: 'consulting-advisory',
        areaOfStudy: 'astronomy',
      });

      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.lastName).toBe('Smith');
      expect(updatedUser.occupation).toBe('consulting-advisory');
      expect(updatedUser.areaOfStudy).toBe('astronomy');
    });

    it('should handle special characters in names', async () => {
      const updatedUser = await updatePersonalInfo(testUserId, {
        firstName: "O'Brien",
        lastName: 'José-María',
        occupation: TEST_OCCUPATION,
        areaOfStudy: TEST_AREAOFSTUDY,
      });

      expect(updatedUser.firstName).toBe("O'Brien");
      expect(updatedUser.lastName).toBe('José-María');
    });

    it('should validate occupation enum', async () => {
      await expect(
        updatePersonalInfo(testUserId, {
          firstName: TEST_FIRSTNAME,
          lastName: TEST_LASTNAME,
          occupation: 'invalid-occupation' as any,
          areaOfStudy: TEST_AREAOFSTUDY,
        })
      ).rejects.toThrow();
    });

    it('should validate areaOfStudy enum', async () => {
      await expect(
        updatePersonalInfo(testUserId, {
          firstName: TEST_FIRSTNAME,
          lastName: TEST_LASTNAME,
          occupation: TEST_OCCUPATION,
          areaOfStudy: 'invalid-area' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('markAccountFordeletion', () => {
    it('should mark account for deletion with correct password', async () => {
      const beforeMark = Date.now();
      const result = await markAccountFordeletion(testUserId, TEST_PASSWORD);
      const afterMark = Date.now();

      const expectedMin = beforeMark + ACCOUNT_DELETION_DAYS * 24 * 60 * 60 * 1000;
      const expectedMax = afterMark + ACCOUNT_DELETION_DAYS * 24 * 60 * 60 * 1000;
      const actualTime = result.user.deletionScheduleAt.getTime();

      expect(result.user.markedForDeletion).toBe(true);
      expect(result.user.deletionScheduleAt).toBeDefined();
      expect(result.days).toBe(ACCOUNT_DELETION_DAYS);
      expect(actualTime).toBeGreaterThanOrEqual(expectedMin);
      expect(actualTime).toBeLessThanOrEqual(expectedMax);
    });

    it('should throw when password is incorrect', async () => {
      await expect(markAccountFordeletion(testUserId, TEST_PASSWORD_DIFFERENT)).rejects.toThrow(
        AppError
      );

      await expect(markAccountFordeletion(testUserId, TEST_PASSWORD_DIFFERENT)).rejects.toThrow(
        'Incorrect password!'
      );
    });

    it('should throw with correct status code for wrong password', async () => {
      try {
        await markAccountFordeletion(testUserId, 'wrongPassword');
        fail('Should have thrown error');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
      }
    });

    it('should throw when user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(markAccountFordeletion(fakeId, TEST_PASSWORD)).rejects.toThrow(
        'User not found!'
      );
    });

    it('should return correct number of days', async () => {
      const result = await markAccountFordeletion(testUserId, TEST_PASSWORD);

      expect(result.days).toBe(ACCOUNT_DELETION_DAYS);
    });

    it('should persist deletion mark to database', async () => {
      await markAccountFordeletion(testUserId, TEST_PASSWORD);

      const user = await User.findById(testUserId);
      expect(user.markedForDeletion).toBe(true);
      expect(user.deletionScheduleAt).toBeDefined();
    });
  });

  describe('Others', () => {
    it('should handle concurrent updates', async () => {
      const promises = [
        updateUsernameOrEmail(testUserId, {username: TEST_USERNAME_AVAILABLE}),
        updatePersonalInfo(testUserId, {
          firstName: TEST_FIRSTNAME,
          lastName: TEST_LASTNAME,
          occupation: TEST_OCCUPATION,
          areaOfStudy: TEST_AREAOFSTUDY,
        }),
      ];

      await Promise.all(promises);

      const user = await findUserById(testUserId);
      expect(user.username).toBe(TEST_USERNAME_AVAILABLE);
      expect(user.firstName).toBe(TEST_FIRSTNAME);
      expect(user.lastName).toBe(TEST_LASTNAME);
      expect(user.occupation).toBe(TEST_OCCUPATION);
      expect(user.areaOfStudy).toBe(TEST_AREAOFSTUDY);
    });
  });
});
