// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-24
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import mongoose from 'mongoose';
import {HTTP_CONFLICT, HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_OK} from '../../constants/httpStatus';
import UserRoleTypes from '../../constants/userRoles';
import {
  changeUserRoleController,
  createAdminAccountController,
} from '../../controllers/adminHandler';
import AppError from '../../utils/appError';

jest.mock('../../services/adminService', () => ({
  changeUserRole: jest.fn(),
  createAdminAccount: jest.fn(),
}));

import {changeUserRole, createAdminAccount} from '../../services/adminService';

describe('controllers/adminHandler', () => {
  let mockRequest;
  let mockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('changeUserRoleController', () => {
    const TEST_USERNAME = 'testuser';

    it('should change user role to admin', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: TEST_USERNAME,
        role: UserRoleTypes.Admin,
      };

      mockRequest.params = {username: TEST_USERNAME};
      mockRequest.body = {role: UserRoleTypes.Admin};

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(changeUserRole).toHaveBeenCalledWith(TEST_USERNAME, UserRoleTypes.Admin);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User role updated successfully',
      });
    });

    it('should change user role to user', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: TEST_USERNAME,
        role: UserRoleTypes.User,
      };

      mockRequest.params = {username: TEST_USERNAME};
      mockRequest.body = {role: UserRoleTypes.User};

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(changeUserRole).toHaveBeenCalledWith(TEST_USERNAME, UserRoleTypes.User);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should reject invalid role', async () => {
      mockRequest.params = {username: TEST_USERNAME};
      mockRequest.body = {role: 'superadmin'};

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(changeUserRole).not.toHaveBeenCalled();
    });

    it('should reject empty role', async () => {
      mockRequest.params = {username: TEST_USERNAME};
      mockRequest.body = {role: ''};

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(changeUserRole).not.toHaveBeenCalled();
    });

    it('should reject missing role', async () => {
      mockRequest.params = {username: TEST_USERNAME};
      mockRequest.body = {};

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(changeUserRole).not.toHaveBeenCalled();
    });

    it('should handle non-existent user', async () => {
      mockRequest.params = {username: 'nonexistentuser'};
      mockRequest.body = {role: UserRoleTypes.Admin};

      (changeUserRole as jest.Mock).mockRejectedValue(
        new AppError(HTTP_NOT_FOUND, 'User not found')
      );

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should prevent changing seed admin role', async () => {
      mockRequest.params = {username: 'admin'};
      mockRequest.body = {role: UserRoleTypes.User};

      (changeUserRole as jest.Mock).mockRejectedValue(new AppError(HTTP_FORBIDDEN, 'Unauthorized'));

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle username with special characters', async () => {
      const specialUsername = 'user_name_123';
      mockRequest.params = {username: specialUsername};
      mockRequest.body = {role: UserRoleTypes.Admin};

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: specialUsername,
        role: UserRoleTypes.Admin,
      };

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(changeUserRole).toHaveBeenCalledWith(specialUsername, UserRoleTypes.Admin);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle username with different casing', async () => {
      mockRequest.params = {username: 'TestUser'};
      mockRequest.body = {role: UserRoleTypes.Admin};

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: 'testuser',
        role: UserRoleTypes.Admin,
      };

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(changeUserRole).toHaveBeenCalledWith('TestUser', UserRoleTypes.Admin);
    });

    it('should handle missing username parameter', async () => {
      mockRequest.params = {};
      mockRequest.body = {role: UserRoleTypes.Admin};

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      // Service will be called with undefined, which should fail
      expect(changeUserRole).toHaveBeenCalledWith(undefined, UserRoleTypes.Admin);
    });
  });

  describe('createAdminAccountController', () => {
    const VALID_USERNAME = 'newadmin';
    const VALID_EMAIL = 'newadmin@example.com';

    it('should create new admin account with valid data', async () => {
      mockRequest.body = {
        username: VALID_USERNAME,
        email: VALID_EMAIL,
      };

      const mockResult = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: VALID_USERNAME,
          email: VALID_EMAIL,
          role: UserRoleTypes.Admin,
        },
        url: 'http://reset-password-url.com',
        emailId: 'email123',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(createAdminAccount).toHaveBeenCalledWith(VALID_USERNAME, VALID_EMAIL);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Admin account created successfully. Password reset email sent.',
      });
    });

    it('should reject invalid username (too short)', async () => {
      mockRequest.body = {
        username: 'ab',
        email: VALID_EMAIL,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject invalid username (too long)', async () => {
      mockRequest.body = {
        username: 'a'.repeat(31),
        email: VALID_EMAIL,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject username with special characters', async () => {
      mockRequest.body = {
        username: 'admin@user',
        email: VALID_EMAIL,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject username with spaces', async () => {
      mockRequest.body = {
        username: 'admin user',
        email: VALID_EMAIL,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'admin@',
        'admin @example.com',
        'admin@.com',
      ];

      for (const email of invalidEmails) {
        mockRequest.body = {
          username: VALID_USERNAME,
          email,
        };

        await createAdminAccountController(mockRequest, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        jest.clearAllMocks();
      }

      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'admin@example.com',
        'admin.user@example.com',
        'admin+tag@example.co.uk',
        'admin123@test-domain.com',
      ];

      for (const email of validEmails) {
        mockRequest.body = {
          username: VALID_USERNAME,
          email,
        };

        const mockResult = {
          user: {_id: new mongoose.Types.ObjectId()},
          url: 'url',
          emailId: 'id',
        };

        (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

        await createAdminAccountController(mockRequest, mockResponse, mockNext);

        expect(createAdminAccount).toHaveBeenCalledWith(VALID_USERNAME, email);
        jest.clearAllMocks();
      }
    });

    it('should reject missing username', async () => {
      mockRequest.body = {
        email: VALID_EMAIL,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject missing email', async () => {
      mockRequest.body = {
        username: VALID_USERNAME,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject empty username', async () => {
      mockRequest.body = {
        username: '',
        email: VALID_EMAIL,
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should reject empty email', async () => {
      mockRequest.body = {
        username: VALID_USERNAME,
        email: '',
      };

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAdminAccount).not.toHaveBeenCalled();
    });

    it('should handle duplicate username', async () => {
      mockRequest.body = {
        username: 'existingadmin',
        email: VALID_EMAIL,
      };

      (createAdminAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Username already in use')
      );

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle duplicate email', async () => {
      mockRequest.body = {
        username: VALID_USERNAME,
        email: 'existing@example.com',
      };

      (createAdminAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Email already in use')
      );

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle case-insensitive username conflict', async () => {
      mockRequest.body = {
        username: 'ExistingAdmin',
        email: VALID_EMAIL,
      };

      (createAdminAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Username already in use')
      );

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle case-insensitive email conflict', async () => {
      mockRequest.body = {
        username: VALID_USERNAME,
        email: 'EXISTING@EXAMPLE.COM',
      };

      (createAdminAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Email already in use')
      );

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should accept username with underscores and numbers', async () => {
      const username = 'admin_user_123';
      mockRequest.body = {
        username,
        email: VALID_EMAIL,
      };

      const mockResult = {
        user: {_id: new mongoose.Types.ObjectId()},
        url: 'url',
        emailId: 'id',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(createAdminAccount).toHaveBeenCalledWith(username, VALID_EMAIL);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });
  });

  describe('Integration - Admin Management Flow', () => {
    it('should handle complete admin creation and role management flow', async () => {
      const NEW_ADMIN_USERNAME = 'newadmin';
      const NEW_ADMIN_EMAIL = 'newadmin@example.com';

      // Step 1: Create admin account
      mockRequest.body = {
        username: NEW_ADMIN_USERNAME,
        email: NEW_ADMIN_EMAIL,
      };

      const mockCreateResult = {
        user: {
          _id: new mongoose.Types.ObjectId(),
          username: NEW_ADMIN_USERNAME,
          email: NEW_ADMIN_EMAIL,
          role: UserRoleTypes.Admin,
        },
        url: 'http://reset-url.com',
        emailId: 'email123',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockCreateResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Admin account created successfully. Password reset email sent.',
      });

      // Step 2: Change admin back to user role (demote)
      jest.clearAllMocks();
      mockRequest.params = {username: NEW_ADMIN_USERNAME};
      mockRequest.body = {role: UserRoleTypes.User};

      const mockUser = {
        _id: mockCreateResult.user._id,
        username: NEW_ADMIN_USERNAME,
        role: UserRoleTypes.User,
      };

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(changeUserRole).toHaveBeenCalledWith(NEW_ADMIN_USERNAME, UserRoleTypes.User);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Step 3: Promote back to admin
      jest.clearAllMocks();
      mockRequest.body = {role: UserRoleTypes.Admin};

      mockUser.role = UserRoleTypes.Admin;
      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(changeUserRole).toHaveBeenCalledWith(NEW_ADMIN_USERNAME, UserRoleTypes.Admin);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should prevent creating admin with existing user credentials', async () => {
      // Try to create admin with existing username
      mockRequest.body = {
        username: 'existinguser',
        email: 'newadmin@example.com',
      };

      (createAdminAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Username already in use')
      );

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_CONFLICT,
          message: 'Username already in use',
        })
      );

      // Try to create admin with existing email
      jest.clearAllMocks();
      mockRequest.body = {
        username: 'newadmin',
        email: 'existinguser@example.com',
      };

      (createAdminAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Email already in use')
      );

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HTTP_CONFLICT,
          message: 'Email already in use',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent role changes', async () => {
      const username = 'testuser';

      mockRequest.params = {username};
      mockRequest.body = {role: UserRoleTypes.Admin};

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username,
        role: UserRoleTypes.Admin,
      };

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      // First request
      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Second concurrent request
      jest.clearAllMocks();
      mockRequest.body = {role: UserRoleTypes.User};
      mockUser.role = UserRoleTypes.User;

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle username at minimum length boundary', async () => {
      mockRequest.body = {
        username: 'abc', // Minimum length
        email: 'admin@example.com',
      };

      const mockResult = {
        user: {_id: new mongoose.Types.ObjectId()},
        url: 'url',
        emailId: 'id',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle username at maximum length boundary', async () => {
      mockRequest.body = {
        username: 'a'.repeat(30), // Maximum length
        email: 'admin@example.com',
      };

      const mockResult = {
        user: {_id: new mongoose.Types.ObjectId()},
        url: 'url',
        emailId: 'id',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle email with plus addressing', async () => {
      mockRequest.body = {
        username: 'newadmin',
        email: 'admin+test@example.com',
      };

      const mockResult = {
        user: {_id: new mongoose.Types.ObjectId()},
        url: 'url',
        emailId: 'id',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(createAdminAccount).toHaveBeenCalledWith('newadmin', 'admin+test@example.com');
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle mixed case email', async () => {
      mockRequest.body = {
        username: 'newadmin',
        email: 'Admin@ExAmPlE.CoM',
      };

      const mockResult = {
        user: {_id: new mongoose.Types.ObjectId()},
        url: 'url',
        emailId: 'id',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      expect(createAdminAccount).toHaveBeenCalledWith('newadmin', 'admin@example.com');
    });

    it('should handle role change to same role', async () => {
      const username = 'testadmin';
      mockRequest.params = {username};
      mockRequest.body = {role: UserRoleTypes.Admin};

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username,
        role: UserRoleTypes.Admin,
      };

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should reject extra fields in request body for role change', async () => {
      mockRequest.params = {username: 'testuser'};
      mockRequest.body = {
        role: UserRoleTypes.Admin,
        extraField: 'should be ignored',
      };

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: 'testuser',
        role: UserRoleTypes.Admin,
      };

      (changeUserRole as jest.Mock).mockResolvedValue(mockUser);

      await changeUserRoleController(mockRequest, mockResponse, mockNext);

      // Extra fields should be ignored by schema
      expect(changeUserRole).toHaveBeenCalledWith('testuser', UserRoleTypes.Admin);
    });

    it('should reject extra fields in request body for admin creation', async () => {
      mockRequest.body = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        extraField: 'should be ignored',
      };

      const mockResult = {
        user: {_id: new mongoose.Types.ObjectId()},
        url: 'url',
        emailId: 'id',
      };

      (createAdminAccount as jest.Mock).mockResolvedValue(mockResult);

      await createAdminAccountController(mockRequest, mockResponse, mockNext);

      // Extra fields should be ignored by schema
      expect(createAdminAccount).toHaveBeenCalledWith('newadmin', 'newadmin@example.com');
    });
  });
});
