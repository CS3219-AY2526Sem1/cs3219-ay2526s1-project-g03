// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-24
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import mongoose from 'mongoose';
import {HTTP_OK} from '../../constants/httpStatus';
import OAuthType from '../../constants/oAuthTypes';
import {
  MAX_PW_LEN,
  MAX_USERNAME_LEN,
  MIN_PW_LEN,
  MIN_USERNAME_LEN,
} from '../../constants/userParams';
import {
  changePasswordHandler,
  changePersonalInfoController,
  changeProfilePictureController,
  changeUsernameOrEmailController,
  getUserController,
  markAccountForDeletionController,
  unlinkOAuthController,
} from '../../controllers/userHandler';
import Session from '../../models/session';
import User from '../../models/user';
import AppError from '../../utils/appError';

jest.mock('../../services/authService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({url: 'http://test.com', emailId: '123'}),
  unlinkOAuthProvider: jest.fn(),
}));

jest.mock('../../utils/imageProcessor', () => ({
  processProfilePicture: jest.fn().mockResolvedValue('data:image/jpeg;base64,/9j/2woRAYgewoP/9k='),
}));

jest.mock('../../models/session');

import {sendVerificationEmail, unlinkOAuthProvider} from '../../services/authService';
import {processProfilePicture} from '../../utils/imageProcessor';

describe('controllers/userHandler', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  let testUser;

  const TEST_USERNAME = 'testuser';
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'password123';

  beforeEach(async () => {
    testUser = await User.create({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      verified: true,
    });

    mockRequest = {
      userId: testUser._id.toString(),
      body: {},
      file: undefined,
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(data => {
        return JSON.parse(JSON.stringify(data));
      }),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('getUserController', () => {
    it('should return user data without sensitive fields', async () => {
      await getUserController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.username).toBe(TEST_USERNAME);
      expect(jsonCall.email).toBe(TEST_EMAIL);

      expect(jsonCall).not.toHaveProperty('passwordHash');
      expect(jsonCall).not.toHaveProperty('passwordSalt');
      expect(jsonCall).not.toHaveProperty('passwordIterations');
      expect(jsonCall).not.toHaveProperty('markedForDeletion');
      expect(jsonCall).not.toHaveProperty('deletionScheduleAt');
    });

    it('should handle non-existent user gracefully', async () => {
      mockRequest.userId = new mongoose.Types.ObjectId().toString();

      await getUserController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should include all profile fields when present', async () => {
      testUser.firstName = 'John';
      testUser.lastName = 'Doe';
      testUser.occupation = 'information-technology';
      testUser.areaOfStudy = 'computer-science';
      testUser.profilePicture = 'https://example.com/pic.jpg';
      testUser.googleOAuthId = 'google123';
      await testUser.save();

      await getUserController(mockRequest, mockResponse, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.firstName).toBe('John');
      expect(jsonCall.lastName).toBe('Doe');
      expect(jsonCall.occupation).toBe('information-technology');
      expect(jsonCall.areaOfStudy).toBe('computer-science');
      expect(jsonCall.profilePicture).toBe('https://example.com/pic.jpg');

      expect(jsonCall).not.toHaveProperty('passwordHash');
      expect(jsonCall).not.toHaveProperty('passwordSalt');
      expect(jsonCall).not.toHaveProperty('passwordIterations');
      expect(jsonCall).not.toHaveProperty('markedForDeletion');
      expect(jsonCall).not.toHaveProperty('deletionScheduleAt');
      expect(jsonCall).not.toHaveProperty('googleOAuthId');
    });
  });

  describe('changeUsernameOrEmailController', () => {
    it('should handle simultaneous username and email change', async () => {
      mockRequest.body = {
        username: 'newusername',
        email: 'newemail@example.com',
      };

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.username).toBe('newusername');
      expect(updatedUser.email).toBe('newemail@example.com');
      expect(sendVerificationEmail).toHaveBeenCalledWith('newemail@example.com');
    });

    it('should reject username at minimum boundary - 1', async () => {
      mockRequest.body = {username: 'a'.repeat(MIN_USERNAME_LEN - 1)};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should accept username at minimum boundary', async () => {
      mockRequest.body = {username: 'a'.repeat(MIN_USERNAME_LEN)};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should accept username at maximum boundary', async () => {
      mockRequest.body = {username: 'a'.repeat(MAX_USERNAME_LEN)};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should reject username at maximum boundary + 1', async () => {
      mockRequest.body = {username: 'a'.repeat(MAX_USERNAME_LEN + 1)};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject username with special characters', async () => {
      mockRequest.body = {username: 'user@name!'};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject username with spaces', async () => {
      mockRequest.body = {username: 'user name'};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      for (const email of invalidEmails) {
        mockRequest.body = {email};

        await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        jest.clearAllMocks();
      }
    });

    it('should reject when neither username nor email provided', async () => {
      mockRequest.body = {};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle case-insensitive username conflicts', async () => {
      await User.create({
        username: 'ExistingUser',
        email: 'existing@example.com',
        password: 'password123',
      });

      mockRequest.body = {username: 'existinguser'};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle case-insensitive email conflicts', async () => {
      await User.create({
        username: 'existinguser',
        email: 'EXISTING@EXAMPLE.COM',
        password: 'password123',
      });

      mockRequest.body = {email: 'existing@example.com'};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should not send verification email when only username changes', async () => {
      mockRequest.body = {username: 'newusername'};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should send verification email when only email changes', async () => {
      mockRequest.body = {email: 'newemail@example.com'};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(sendVerificationEmail).toHaveBeenCalledWith('newemail@example.com');
    });
  });

  describe('changeProfilePictureController', () => {
    it('should upload and process profile picture', async () => {
      mockRequest.file = {
        buffer: Buffer.from('fake image data'),
        fieldname: 'profilePicture',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      expect(processProfilePicture).toHaveBeenCalledWith(mockRequest.file.buffer);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.profilePicture).toBe('data:image/jpeg;base64,/9j/2woRAYgewoP/9k=');
    });

    it('should delete profile picture when delete flag is true', async () => {
      testUser.profilePicture = 'https://example.com/old.jpg';
      await testUser.save();

      mockRequest.body = {delete: 'true'};

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Profile picture removed successfully!',
      });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.profilePicture).toBeUndefined();
    });

    it('should reject when no file and delete flag is false', async () => {
      mockRequest.file = undefined;
      mockRequest.body = {delete: 'false'};

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject when no file and no delete flag', async () => {
      mockRequest.file = undefined;
      mockRequest.body = {};

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('changePasswordHandler', () => {
    it('should change password for user with existing password', async () => {
      mockRequest.body = {
        currentPassword: TEST_PASSWORD,
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      const isValid = await updatedUser.comparePassword('newPassword456');
      expect(isValid).toBe(true);
    });

    it('should reject password change with incorrect current password', async () => {
      mockRequest.body = {
        currentPassword: 'wrongPassword',
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should set password for OAuth user without existing password', async () => {
      const oauthUser = await User.create({
        username: 'oauthuser',
        googleOAuthId: 'google123',
      });

      mockRequest.userId = oauthUser._id.toString();
      mockRequest.body = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(oauthUser._id);
      expect(updatedUser.hasPassword).toBe(true);
    });

    it('should reject when passwords do not match', async () => {
      mockRequest.body = {
        currentPassword: TEST_PASSWORD,
        password: 'newPassword456',
        confirmPassword: 'differentPassword',
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject password at minimum boundary - 1', async () => {
      mockRequest.body = {
        currentPassword: TEST_PASSWORD,
        password: 'a'.repeat(MIN_PW_LEN - 1),
        confirmPassword: 'a'.repeat(MIN_PW_LEN - 1),
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should accept password at minimum boundary', async () => {
      const minPassword = 'a'.repeat(MIN_PW_LEN);
      mockRequest.body = {
        currentPassword: TEST_PASSWORD,
        password: minPassword,
        confirmPassword: minPassword,
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should accept password at maximum boundary', async () => {
      const maxPassword = 'a'.repeat(MAX_PW_LEN);
      mockRequest.body = {
        currentPassword: TEST_PASSWORD,
        password: maxPassword,
        confirmPassword: maxPassword,
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should reject password at maximum boundary + 1', async () => {
      const tooLongPassword = 'a'.repeat(MAX_PW_LEN + 1);
      mockRequest.body = {
        currentPassword: TEST_PASSWORD,
        password: tooLongPassword,
        confirmPassword: tooLongPassword,
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should require currentPassword for users with existing password', async () => {
      mockRequest.body = {
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('changePersonalInfoController', () => {
    it('should update all personal information fields', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('John');
      expect(updatedUser.lastName).toBe('Doe');
      expect(updatedUser.occupation).toBe('information-technology');
      expect(updatedUser.areaOfStudy).toBe('computer-science');
      expect(updatedUser.profileComplete).toBe(true);
    });

    it('should handle names with special characters', async () => {
      mockRequest.body = {
        firstName: "O'Connor-Lee",
        lastName: 'äöüáàâéèêë李飞飞',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe("O'Connor-Lee");
      expect(updatedUser.lastName).toBe('äöüáàâéèêë李飞飞');
    });

    it('should reject empty firstName', async () => {
      mockRequest.body = {
        firstName: '',
        lastName: 'Doe',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject empty lastName', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: '',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject names that are too long', async () => {
      mockRequest.body = {
        firstName: 'a'.repeat(51),
        lastName: 'Doe',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject names with numbers', async () => {
      mockRequest.body = {
        firstName: 'John123',
        lastName: 'Doe',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject invalid occupation', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
        occupation: 'invalid-occupation',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject invalid areaOfStudy', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
        occupation: 'information-technology',
        areaOfStudy: 'invalid-area',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject when missing required fields', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('markAccountForDeletionController', () => {
    it('should mark account for deletion with correct password', async () => {
      (Session.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 1});

      mockRequest.body = {password: TEST_PASSWORD};

      await markAccountForDeletionController(mockRequest, mockResponse, mockNext);

      expect(Session.deleteMany).toHaveBeenCalledWith({userId: testUser._id.toString()});
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/auth/refresh',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.markedForDeletion).toBe(true);
      expect(updatedUser.deletionScheduleAt).toBeDefined();
    });

    it('should reject when password is missing', async () => {
      mockRequest.body = {};

      await markAccountForDeletionController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject with incorrect password', async () => {
      mockRequest.body = {password: 'wrongPassword'};

      await markAccountForDeletionController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should delete all user sessions', async () => {
      (Session.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 3});

      mockRequest.body = {password: TEST_PASSWORD};

      await markAccountForDeletionController(mockRequest, mockResponse, mockNext);

      expect(Session.deleteMany).toHaveBeenCalledWith({userId: testUser._id.toString()});
    });

    it('should clear authentication cookies', async () => {
      (Session.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 1});

      mockRequest.body = {password: TEST_PASSWORD};

      await markAccountForDeletionController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('unlinkOAuthController', () => {
    beforeEach(async () => {
      testUser.googleOAuthId = 'google123';
      testUser.githubOAuthId = 'github456';
      await testUser.save();

      (unlinkOAuthProvider as jest.Mock).mockResolvedValue({
        user: testUser,
      });
    });

    it('should unlink Google OAuth provider', async () => {
      mockRequest.params = {provider: OAuthType.Google};

      await unlinkOAuthController(mockRequest, mockResponse, mockNext);

      expect(unlinkOAuthProvider).toHaveBeenCalledWith(testUser._id.toString(), OAuthType.Google);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Google account unlinked!',
        })
      );
    });

    it('should unlink GitHub OAuth provider', async () => {
      mockRequest.params = {provider: OAuthType.GitHub};

      await unlinkOAuthController(mockRequest, mockResponse, mockNext);

      expect(unlinkOAuthProvider).toHaveBeenCalledWith(testUser._id.toString(), OAuthType.GitHub);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Github account unlinked!',
        })
      );
    });

    it('should reject invalid OAuth provider', async () => {
      mockRequest.params = {provider: 'invalid'};

      await unlinkOAuthController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should return updated user after unlinking', async () => {
      mockRequest.params = {provider: OAuthType.Google};

      await unlinkOAuthController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.any(Object),
        })
      );
    });

    it('should handle provider name capitalization', async () => {
      mockRequest.params = {provider: 'google'};

      await unlinkOAuthController(mockRequest, mockResponse, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.message).toContain('Google');
    });
  });

  describe('Integration - Complete Profile Update Flow', () => {
    it('should handle complete profile setup from OAuth user', async () => {
      const oauthUser = await User.create({
        username: 'oauthuser',
        googleOAuthId: 'google123',
      });

      mockRequest.userId = oauthUser._id.toString();

      // Step 1: Set password
      mockRequest.body = {
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };

      await changePasswordHandler(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Step 2: Update username and email
      jest.clearAllMocks();
      mockRequest.body = {
        username: 'newusername',
        email: 'newemail@example.com',
      };

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Step 3: Add personal information
      jest.clearAllMocks();
      mockRequest.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        occupation: 'student',
        areaOfStudy: 'mathematics',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Step 4: Upload profile picture
      jest.clearAllMocks();
      mockRequest.file = {
        buffer: Buffer.from('image data'),
        fieldname: 'profilePicture',
        originalname: 'profile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Verify final state
      const finalUser = await User.findById(oauthUser._id);
      expect(finalUser.hasPassword).toBe(true);
      expect(finalUser.username).toBe('newusername');
      expect(finalUser.email).toBe('newemail@example.com');
      expect(finalUser.firstName).toBe('Jane');
      expect(finalUser.lastName).toBe('Smith');
      expect(finalUser.profileComplete).toBe(true);
      expect(finalUser.profilePicture).toBeDefined();
    });

    it('should handle account deletion flow', async () => {
      (Session.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 2});

      // Update personal info
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      // Mark for deletion
      jest.clearAllMocks();
      mockRequest.body = {password: TEST_PASSWORD};

      await markAccountForDeletionController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser.markedForDeletion).toBe(true);
      expect(Session.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent username changes', async () => {
      const promises = [
        changeUsernameOrEmailController(
          {...mockRequest, body: {username: 'username1'}},
          mockResponse,
          mockNext
        ),
        changeUsernameOrEmailController(
          {...mockRequest, body: {username: 'username2'}},
          mockResponse,
          mockNext
        ),
      ];

      await Promise.allSettled(promises);

      const finalUser = await User.findById(testUser._id);
      expect(['username1', 'username2']).toContain(finalUser.username);
    });

    it('should handle invalid user ID format', async () => {
      mockRequest.userId = 'invalid-id';

      await getUserController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle profile picture upload after deletion', async () => {
      // Delete picture
      mockRequest.body = {delete: 'true'};

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      // Upload new picture
      jest.clearAllMocks();
      mockRequest.body = {};
      mockRequest.file = {
        buffer: Buffer.from('new image'),
        fieldname: 'profilePicture',
        originalname: 'new.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      await changeProfilePictureController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.profilePicture).toBeDefined();
    });

    it('should handle updating to same username', async () => {
      mockRequest.body = {username: TEST_USERNAME};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle updating to same email', async () => {
      mockRequest.body = {email: TEST_EMAIL};

      await changeUsernameOrEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle whitespace in names', async () => {
      mockRequest.body = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        occupation: 'information-technology',
        areaOfStudy: 'computer-science',
      };

      await changePersonalInfoController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('John');
      expect(updatedUser.lastName).toBe('Doe');
      expect(updatedUser.profileComplete).toBe(true);
    });
  });
});
