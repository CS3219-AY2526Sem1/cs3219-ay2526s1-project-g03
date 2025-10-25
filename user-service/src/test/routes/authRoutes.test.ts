// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-09-2025
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import express, {Express} from 'express';
import request from 'supertest';
import {HTTP_CREATED, HTTP_NOT_FOUND, HTTP_OK} from '../../constants/httpStatus';
import {
  forgotPasswordController,
  githubAuthController,
  githubCallbackController,
  googleAuthController,
  googleCallbackController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  resendEmailController,
  resetPasswordController,
  verifyEmailController,
} from '../../controllers/authHandler';
import authRoutes from '../../routes/authRoutes';

jest.mock('../../controllers/authHandler');

describe('routes/authRoute', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /auth/email/verify/:code', () => {
    it('should call verifyEmailController with correct parameters', async () => {
      const mockController = verifyEmailController as jest.MockedFunction<
        typeof verifyEmailController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Email verified successfully'});
      });

      const response = await request(app).get('/auth/email/verify/abc123');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Email verified successfully'});
    });

    it('should handle verification code parameter correctly', async () => {
      const mockController = verifyEmailController as jest.MockedFunction<
        typeof verifyEmailController
      >;
      const verificationCode = 'xyz789';

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.params.code).toBe(verificationCode);
        res.status(HTTP_OK).json({message: 'Verified'});
      });

      await request(app).get(`/auth/email/verify/${verificationCode}`);

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('GET /auth/refresh', () => {
    it('should call refreshController', async () => {
      const mockController = refreshController as jest.MockedFunction<typeof refreshController>;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({accessToken: 'new-token'});
      });

      const response = await request(app).get('/auth/refresh');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('GET /auth/logout', () => {
    it('should call logoutController', async () => {
      const mockController = logoutController as jest.MockedFunction<typeof logoutController>;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Logged out successfully'});
      });

      const response = await request(app).get('/auth/logout');

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Logged out successfully'});
    });
  });

  describe('POST /auth/register', () => {
    it('should call registerController with correct parameters', async () => {
      const mockController = registerController as jest.MockedFunction<typeof registerController>;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_CREATED).json({message: 'User registered successfully'});
      });

      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const response = await request(app).post('/auth/register').send(registrationData);

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_CREATED);
      expect(response.body).toEqual({message: 'User registered successfully'});
    });

    it('should handle request body correctly', async () => {
      const mockController = registerController as jest.MockedFunction<typeof registerController>;
      const userData = {
        username: 'john',
        email: 'john@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
      };

      mockController.mockImplementation(async (req, res, next) => {
        expect(req.body).toEqual(userData);
        res.status(HTTP_CREATED).json({success: true});
      });

      await request(app).post('/auth/register').send(userData);

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('should call loginController with correct parameters', async () => {
      const mockController = loginController as jest.MockedFunction<typeof loginController>;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({accessToken: 'token123'});
      });

      const loginData = {
        identifier: 'testuser',
        password: 'Password123!',
      };

      const response = await request(app).post('/auth/login').send(loginData);

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /auth/email/resend', () => {
    it('should call resendEmailController', async () => {
      const mockController = resendEmailController as jest.MockedFunction<
        typeof resendEmailController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Email resent successfully'});
      });

      const response = await request(app).post('/auth/email/resend').send({
        email: 'test@example.com',
      });

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Email resent successfully'});
    });
  });

  describe('POST /auth/password/forgot', () => {
    it('should call forgotPasswordController', async () => {
      const mockController = forgotPasswordController as jest.MockedFunction<
        typeof forgotPasswordController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Password reset email sent'});
      });

      const response = await request(app).post('/auth/password/forgot').send({
        email: 'user@example.com',
      });

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Password reset email sent'});
    });
  });

  describe('POST /auth/password/reset', () => {
    it('should call resetPasswordController', async () => {
      const mockController = resetPasswordController as jest.MockedFunction<
        typeof resetPasswordController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.status(HTTP_OK).json({message: 'Password reset successfully'});
      });

      const resetData = {
        verificationCode: 'code123',
        password: 'NewPassword123!',
      };

      const response = await request(app).post('/auth/password/reset').send(resetData);

      expect(mockController).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(HTTP_OK);
      expect(response.body).toEqual({message: 'Password reset successfully'});
    });
  });

  describe('GET /auth/google', () => {
    it('should call googleAuthController', async () => {
      const mockController = googleAuthController as jest.MockedFunction<
        typeof googleAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.redirect('https://accounts.google.com/oauth');
      });

      const response = await request(app).get('/auth/google');

      expect(mockController).toHaveBeenCalledTimes(1);
    });

    it('should handle link query parameter', async () => {
      const mockController = googleAuthController as jest.MockedFunction<
        typeof googleAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        expect(req.query.link).toBe('true');
        res.redirect('https://accounts.google.com/oauth');
      });

      await request(app).get('/auth/google?link=true');

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should call googleCallbackController', async () => {
      const mockController = googleCallbackController as jest.MockedFunction<
        typeof googleCallbackController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.redirect('/profile');
      });

      const response = await request(app).get('/auth/google/callback?code=abc123');

      expect(mockController).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /auth/github', () => {
    it('should call githubAuthController', async () => {
      const mockController = githubAuthController as jest.MockedFunction<
        typeof githubAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.redirect('https://github.com/login/oauth/authorize');
      });

      const response = await request(app).get('/auth/github');

      expect(mockController).toHaveBeenCalledTimes(1);
    });

    it('should handle link query parameter', async () => {
      const mockController = githubAuthController as jest.MockedFunction<
        typeof githubAuthController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        expect(req.query.link).toBe('true');
        res.redirect('https://github.com/login/oauth/authorize');
      });

      await request(app).get('/auth/github?link=true');

      expect(mockController).toHaveBeenCalled();
    });
  });

  describe('GET /auth/github/callback', () => {
    it('should call githubCallbackController', async () => {
      const mockController = githubCallbackController as jest.MockedFunction<
        typeof githubCallbackController
      >;
      mockController.mockImplementation(async (req, res, next) => {
        res.redirect('/profile');
      });

      const response = await request(app).get('/auth/github/callback?code=xyz789');

      expect(mockController).toHaveBeenCalledTimes(1);
    });
  });

  describe('Route registration', () => {
    it('should have all routes registered', () => {
      const routes = authRoutes.stack.filter(layer => layer.route).map(layer => layer.route.path);

      expect(routes).toContain('/email/verify/:code');
      expect(routes).toContain('/refresh');
      expect(routes).toContain('/login');
      expect(routes).toContain('/email/resend');
      expect(routes).toContain('/password/forgot');
      expect(routes).toContain('/password/reset');
      expect(routes).toContain('/google');
      expect(routes).toContain('/google/callback');
      expect(routes).toContain('/github');
      expect(routes).toContain('/github/callback');
    });
  });

  describe('Invalid routes', () => {
    it('should return HTTP_NOT_FOUND for undefined routes', async () => {
      const response = await request(app).get('/auth/nonexistent');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });

    it('should return HTTP_NOT_FOUND for wrong HTTP method', async () => {
      const response = await request(app).delete('/auth/login');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });

    it('should return HTTP_NOT_FOUND for missing route parameters', async () => {
      const response = await request(app).get('/auth/email/verify');

      expect(response.status).toBe(HTTP_NOT_FOUND);
    });
  });
});
