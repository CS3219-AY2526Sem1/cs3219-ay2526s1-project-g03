// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-24
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import express, {Express} from 'express';
import request from 'supertest';

jest.mock('../../controllers/userHandler');

jest.mock('../../middleware/upload', () => ({
  upload: {
    single: jest.fn(() => (req, res, next) => next()),
  },
}));

import {HTTP_NOT_FOUND, HTTP_OK} from '../../constants/httpStatus';
import {
  changePasswordHandler,
  changePersonalInfoController,
  changeProfilePictureController,
  changeUsernameOrEmailController,
  getUserController,
  markAccountForDeletionController,
  unlinkOAuthController,
} from '../../controllers/userHandler';
import userRoutes from '../../routes/userRoute';

describe('routes/userRoute', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/user', userRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /user', () => {
    it('should call getUserController', async () => {
      const mockController = getUserController as jest.MockedFunction<typeof getUserController>;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({
          userId: '123',
          username: 'testuser',
          email: 'test@example.com',
        });
      });

      const response = await request(app).get('/user');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toHaveProperty('username');
    });

    it('should return user data', async () => {
      const mockController = getUserController as jest.MockedFunction<typeof getUserController>;
      const userData = {
        userId: 'abc123',
        username: 'john',
        email: 'john@test.com',
        verified: true,
      };

      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json(userData);
      });

      const response = await request(app).get('/user');

      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual(userData);
    });
  });

  describe('DELETE /user/delete', () => {
    it('should call markAccountForDeletionController', async () => {
      const mockController = markAccountForDeletionController as jest.MockedFunction<
        typeof markAccountForDeletionController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Account marked for deletion'});
      });

      const response = await request(app).delete('/user/delete').send({password: 'Password123!'});

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Account marked for deletion'});
    });

    it('should handle request body correctly', async () => {
      const mockController = markAccountForDeletionController as jest.MockedFunction<
        typeof markAccountForDeletionController
      >;
      const deleteData = {password: 'MyPassword123!'};

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body).toEqual(deleteData);
        res.status(HTTP_OK).json({message: 'Deleted'});
      });

      await request(app).delete('/user/delete').send(deleteData);

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('PATCH /user/profile/usernameoremail', () => {
    it('should call changeUsernameOrEmailController', async () => {
      const mockController = changeUsernameOrEmailController as jest.MockedFunction<
        typeof changeUsernameOrEmailController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Username updated successfully'});
      });

      const updateData = {username: 'newusername'};
      const response = await request(app).patch('/user/profile/usernameoremail').send(updateData);

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Username updated successfully'});
    });

    it('should handle username update', async () => {
      const mockController = changeUsernameOrEmailController as jest.MockedFunction<
        typeof changeUsernameOrEmailController
      >;
      const updateData = {username: 'johndoe'};

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body.username).toBe('johndoe');
        res.status(HTTP_OK).json({message: 'Updated'});
      });

      await request(app).patch('/user/profile/usernameoremail').send(updateData);

      expect(mockController).toHaveBeenCalled();
    });

    it('should handle email update', async () => {
      const mockController = changeUsernameOrEmailController as jest.MockedFunction<
        typeof changeUsernameOrEmailController
      >;
      const updateData = {email: 'newemail@test.com'};

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body.email).toBe('newemail@test.com');
        res.status(HTTP_OK).json({message: 'Updated'});
      });

      await request(app).patch('/user/profile/usernameoremail').send(updateData);

      expect(mockController).toHaveBeenCalled();
    });

    it('should handle both username and email update', async () => {
      const mockController = changeUsernameOrEmailController as jest.MockedFunction<
        typeof changeUsernameOrEmailController
      >;
      const updateData = {
        username: 'newuser',
        email: 'newuser@test.com',
      };

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body).toEqual(updateData);
        res.status(HTTP_OK).json({message: 'Updated'});
      });

      await request(app).patch('/user/profile/usernameoremail').send(updateData);

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('PATCH /user/profile/picture', () => {
    it('should call changeProfilePictureController with upload middleware', async () => {
      const mockController = changeProfilePictureController as jest.MockedFunction<
        typeof changeProfilePictureController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Profile picture updated successfully'});
      });

      const response = await request(app).patch('/user/profile/picture');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
    });

    it('should handle file upload', async () => {
      const mockController = changeProfilePictureController as jest.MockedFunction<
        typeof changeProfilePictureController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({
          message: 'Picture updated',
          profilePicture: 'uploads/profile.jpg',
        });
      });

      const response = await request(app).patch('/user/profile/picture');

      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle delete request', async () => {
      const mockController = changeProfilePictureController as jest.MockedFunction<
        typeof changeProfilePictureController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body.delete).toBe('true');
        res.status(HTTP_OK).json({message: 'Picture deleted'});
      });

      await request(app).patch('/user/profile/picture').send({delete: 'true'});

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('PATCH /user/profile/password', () => {
    it('should call changePasswordHandler', async () => {
      const mockController = changePasswordHandler as jest.MockedFunction<
        typeof changePasswordHandler
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Password changed successfully'});
      });

      const passwordData = {
        currentPassword: 'OldPassword123!',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };

      const response = await request(app).patch('/user/profile/password').send(passwordData);

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Password changed successfully'});
    });

    it('should handle password change request body', async () => {
      const mockController = changePasswordHandler as jest.MockedFunction<
        typeof changePasswordHandler
      >;
      const passwordData = {
        currentPassword: 'Current123!',
        password: 'New123!',
        confirmPassword: 'New123!',
      };

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body).toEqual(passwordData);
        res.status(HTTP_OK).json({message: 'Success'});
      });

      await request(app).patch('/user/profile/password').send(passwordData);

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('PATCH /user/profile/personalInfo', () => {
    it('should call changePersonalInfoController', async () => {
      const mockController = changePersonalInfoController as jest.MockedFunction<
        typeof changePersonalInfoController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Personal info updated successfully'});
      });

      const personalData = {
        firstName: 'John',
        lastName: 'Doe',
        occupation: 'software-engineer',
        areaOfStudy: 'computer-science',
      };

      const response = await request(app).patch('/user/profile/personalInfo').send(personalData);

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Personal info updated successfully'});
    });

    it('should handle personal info request body', async () => {
      const mockController = changePersonalInfoController as jest.MockedFunction<
        typeof changePersonalInfoController
      >;
      const personalData = {
        firstName: 'Jane',
        lastName: 'Smith',
        occupation: 'data-scientist',
        areaOfStudy: 'mathematics',
      };

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body).toEqual(personalData);
        res.status(HTTP_OK).json({message: 'Updated'});
      });

      await request(app).patch('/user/profile/personalInfo').send(personalData);

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('DELETE /user/oauth/:provider', () => {
    it('should call unlinkOAuthController for Google', async () => {
      const mockController = unlinkOAuthController as jest.MockedFunction<
        typeof unlinkOAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Google OAuth unlinked successfully'});
      });

      const response = await request(app).delete('/user/oauth/google');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Google OAuth unlinked successfully'});
    });

    it('should call unlinkOAuthController for GitHub', async () => {
      const mockController = unlinkOAuthController as jest.MockedFunction<
        typeof unlinkOAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'GitHub OAuth unlinked successfully'});
      });

      const response = await request(app).delete('/user/oauth/github');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'GitHub OAuth unlinked successfully'});
    });

    it('should handle provider parameter correctly', async () => {
      const mockController = unlinkOAuthController as jest.MockedFunction<
        typeof unlinkOAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        expect(req.params.provider).toBe('google');
        res.status(HTTP_OK).json({message: 'Unlinked'});
      });

      await request(app).delete('/user/oauth/google');

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('Route registration', () => {
    it('should have all routes registered', () => {
      const routes = userRoutes.stack.filter(layer => layer.route).map(layer => layer.route.path);

      expect(routes).toContain('/');
      expect(routes).toContain('/delete');
      expect(routes).toContain('/profile/usernameoremail');
      expect(routes).toContain('/profile/picture');
      expect(routes).toContain('/profile/password');
      expect(routes).toContain('/profile/personalInfo');
      expect(routes).toContain('/oauth/:provider');
    });
  });

  describe('Invalid routes', () => {
    it('should return HTTP_NOT_FOUND for wrong HTTP method', async () => {
      const response = await request(app).post('/user');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });

    it('should return HTTP_NOT_FOUND for invalid profile endpoint', async () => {
      const response = await request(app).patch('/user/profile/invalid');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });
  });
});
