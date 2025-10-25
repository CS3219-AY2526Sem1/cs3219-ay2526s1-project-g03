// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-09-2025
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

import mongoose from 'mongoose';
import {APP_ORIGIN} from '../../constants/env';
import {
  HTTP_CONFLICT,
  HTTP_CREATED,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
} from '../../constants/httpStatus';
import {
  forgotPasswordController,
  githubAuthController,
  googleAuthController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  resendEmailController,
  resetPasswordController,
  verifyEmailController,
} from '../../controllers/authHandler';
import OAuthLink from '../../models/oAuthLink';
import Session from '../../models/session';
import AppError from '../../utils/appError';
import {signToken} from '../../utils/jwt';

jest.mock('../../services/authService', () => ({
  createAccount: jest.fn(),
  verifyEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  loginUser: jest.fn(),
  refreshUserAccessToken: jest.fn(),
  handleOAuthCallback: jest.fn(),
}));

jest.mock('../../models/session');
jest.mock('../../models/oAuthLink');
jest.mock('passport', () => ({
  authenticate: jest.fn(),
}));

import passport from 'passport';
import {
  createAccount,
  forgotPassword,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} from '../../services/authService';

describe('controllers/authHandler', () => {
  let mockRequest;
  let mockResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      cookies: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('registerController', () => {
    const validRegistration = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should register user with valid data', async () => {
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        toJSON: jest.fn().mockReturnValue({
          // ← Add this
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
        }),
      };
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (createAccount as jest.Mock).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      mockRequest.body = validRegistration;

      await registerController(mockRequest, mockResponse, mockNext);

      expect(createAccount).toHaveBeenCalledWith(validRegistration);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_CREATED);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access-token',
        expect.any(Object)
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.any(Object)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(mockUser.toJSON).toHaveBeenCalled();
    });

    it('should reject registration with invalid username', async () => {
      mockRequest.body = {
        ...validRegistration,
        username: 'ab', // Too short
      };

      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAccount).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid email', async () => {
      mockRequest.body = {
        ...validRegistration,
        email: 'invalid-email',
      };

      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAccount).not.toHaveBeenCalled();
    });

    it('should reject registration with mismatched passwords', async () => {
      mockRequest.body = {
        ...validRegistration,
        confirmPassword: 'differentPassword',
      };

      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAccount).not.toHaveBeenCalled();
    });

    it('should reject registration with missing fields', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        // Missing password fields
      };

      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(createAccount).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      (createAccount as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Username already exists')
      );

      mockRequest.body = validRegistration;

      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('verifyEmailController', () => {
    it('should verify email with valid code', async () => {
      const validCode = '507f1f77bcf86cd799439011';
      mockRequest.params = {code: validCode};

      (verifyEmail as jest.Mock).mockResolvedValue(undefined);

      await verifyEmailController(mockRequest, mockResponse, mockNext);

      expect(verifyEmail).toHaveBeenCalledWith(validCode);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email was successfully verified!',
      });
    });

    it('should handle expired verification code', async () => {
      const validCode = '507f1f77bcf86cd799439011';
      mockRequest.params = {code: validCode};

      (verifyEmail as jest.Mock).mockRejectedValue(
        new AppError(HTTP_NOT_FOUND, 'Verification code expired')
      );

      await verifyEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('resendEmailController', () => {
    it('should resend verification email with valid email', async () => {
      mockRequest.body = {email: 'test@example.com'};

      (sendVerificationEmail as jest.Mock).mockResolvedValue({
        url: 'http://verify-url.com',
        emailId: 'email123',
      });

      await resendEmailController(mockRequest, mockResponse, mockNext);

      expect(sendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Verification email resent!',
      });
    });

    it('should reject invalid email format', async () => {
      mockRequest.body = {email: 'invalid-email'};

      await resendEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should reject missing email', async () => {
      mockRequest.body = {};

      await resendEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should handle rate limiting errors', async () => {
      mockRequest.body = {email: 'test@example.com'};

      (sendVerificationEmail as jest.Mock).mockRejectedValue(
        new AppError(HTTP_CONFLICT, 'Too many requests')
      );

      await resendEmailController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('forgotPasswordController', () => {
    it('should send forgot password email with valid email', async () => {
      mockRequest.body = {email: 'test@example.com'};

      (forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await forgotPasswordController(mockRequest, mockResponse, mockNext);

      expect(forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password reset email sent!',
      });
    });

    it('should reject invalid email format', async () => {
      mockRequest.body = {email: 'invalid-email'};

      await forgotPasswordController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(forgotPassword).not.toHaveBeenCalled();
    });

    it('should still return success for non-existent email', async () => {
      mockRequest.body = {email: 'nonexistent@example.com'};

      (forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await forgotPasswordController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });
  });

  describe('resetPasswordController', () => {
    it('should reset password with valid data', async () => {
      mockRequest.body = {
        verificationCode: '507f1f77bcf86cd799439011',
        password: 'newPassword123',
      };

      (resetPassword as jest.Mock).mockResolvedValue(undefined);

      await resetPasswordController(mockRequest, mockResponse, mockNext);

      expect(resetPassword).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/auth/refresh',
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Password reset successful!',
      });
    });

    it('should reject invalid password', async () => {
      mockRequest.body = {
        verificationCode: '507f1f77bcf86cd799439011',
        password: 'short',
      };

      await resetPasswordController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(resetPassword).not.toHaveBeenCalled();
    });

    it('should handle expired verification code', async () => {
      mockRequest.body = {
        verificationCode: '507f1f77bcf86cd799439011',
        password: 'newPassword123',
      };

      (resetPassword as jest.Mock).mockRejectedValue(
        new AppError(HTTP_NOT_FOUND, 'Verification code expired')
      );

      await resetPasswordController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('loginController', () => {
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    it('should login with valid username and password', async () => {
      mockRequest.body = {
        identifier: 'testuser',
        password: 'password123',
      };

      (loginUser as jest.Mock).mockResolvedValue(mockTokens);

      await loginController(mockRequest, mockResponse, mockNext);

      expect(loginUser).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access-token',
        expect.any(Object)
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.any(Object)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful!',
      });
    });

    it('should login with valid email and password', async () => {
      mockRequest.body = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      (loginUser as jest.Mock).mockResolvedValue(mockTokens);

      await loginController(mockRequest, mockResponse, mockNext);

      expect(loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should reject invalid identifier format', async () => {
      mockRequest.body = {
        identifier: 'ab', // Too short for username, invalid email
        password: 'password123',
      };

      await loginController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(loginUser).not.toHaveBeenCalled();
    });

    it('should reject missing password', async () => {
      mockRequest.body = {
        identifier: 'testuser',
      };

      await loginController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(loginUser).not.toHaveBeenCalled();
    });

    it('should handle incorrect credentials', async () => {
      mockRequest.body = {
        identifier: 'testuser',
        password: 'wrongPassword',
      };

      (loginUser as jest.Mock).mockRejectedValue(
        new AppError(HTTP_UNAUTHORIZED, 'Invalid credentials')
      );

      await loginController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle unverified email', async () => {
      mockRequest.body = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      (loginUser as jest.Mock).mockRejectedValue(
        new AppError(HTTP_FORBIDDEN, 'Email not verified')
      );

      await loginController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('logoutController', () => {
    it('should logout user with valid access token', async () => {
      const sessionId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const accessToken = signToken({userId, sessionId});

      mockRequest.cookies = {accessToken};

      (Session.findByIdAndDelete as jest.Mock).mockResolvedValue({_id: sessionId});

      await logoutController(mockRequest, mockResponse, mockNext);

      expect(Session.findByIdAndDelete).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/auth/refresh',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout successful',
      });
    });

    it('should handle logout without access token', async () => {
      mockRequest.cookies = {};

      await logoutController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.clearCookie).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle logout with invalid access token', async () => {
      mockRequest.cookies = {accessToken: 'invalid-token'};

      await logoutController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.clearCookie).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });
  });

  describe('refreshController', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      mockRequest.cookies = {refreshToken};

      (refreshUserAccessToken as jest.Mock).mockResolvedValue({
        accessToken: 'new-access-token',
        newRefreshToken: null,
      });

      await refreshController(mockRequest, mockResponse, mockNext);

      expect(refreshUserAccessToken).toHaveBeenCalledWith(refreshToken);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access-token',
        expect.any(Object)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access token refreshed',
      });
    });

    it('should refresh both tokens when refresh token needs renewal', async () => {
      const refreshToken = 'valid-refresh-token';
      mockRequest.cookies = {refreshToken};

      (refreshUserAccessToken as jest.Mock).mockResolvedValue({
        accessToken: 'new-access-token',
        newRefreshToken: 'new-refresh-token',
      });

      await refreshController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.any(Object)
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access-token',
        expect.any(Object)
      );
    });

    it('should reject when refresh token is missing', async () => {
      mockRequest.cookies = {};

      await refreshController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(refreshUserAccessToken).not.toHaveBeenCalled();
    });

    it('should handle invalid refresh token', async () => {
      mockRequest.cookies = {refreshToken: 'invalid-token'};

      (refreshUserAccessToken as jest.Mock).mockRejectedValue(
        new AppError(HTTP_UNAUTHORIZED, 'Invalid refresh token')
      );

      await refreshController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle expired refresh token', async () => {
      mockRequest.cookies = {refreshToken: 'expired-token'};

      (refreshUserAccessToken as jest.Mock).mockRejectedValue(
        new AppError(HTTP_UNAUTHORIZED, 'Session expired!')
      );

      await refreshController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('googleAuthController', () => {
    it('should initiate Google OAuth flow without linking', async () => {
      mockRequest.query = {};

      const mockAuthenticate = jest.fn((provider, options) => (req, res, next) => {
        expect(provider).toBe('google');
        expect(options.scope).toEqual(['profile', 'email']);
        expect(options.session).toBe(false);
        expect(options.state).toBeUndefined();
      });

      (passport.authenticate as jest.Mock).mockImplementation(mockAuthenticate);

      await googleAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(passport.authenticate).toHaveBeenCalled();
    });

    it('should initiate Google OAuth flow with linking', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const sessionId = new mongoose.Types.ObjectId().toString();
      const accessToken = signToken({userId, sessionId});
      const mockOAuthLinkId = new mongoose.Types.ObjectId();

      mockRequest.query = {link: 'true'};
      mockRequest.cookies = {accessToken};

      (OAuthLink.create as jest.Mock).mockResolvedValue({_id: mockOAuthLinkId});

      const mockAuthenticate = jest.fn((provider, options) => (req, res, next) => {
        const state = JSON.parse(options.state);
        expect(state.link).toBe(true);
        expect(state.linkId).toBe(mockOAuthLinkId.toString());
      });

      (passport.authenticate as jest.Mock).mockImplementation(mockAuthenticate);

      await googleAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(OAuthLink.create).toHaveBeenCalledWith({userId});
      expect(passport.authenticate).toHaveBeenCalled();
    });

    it('should redirect when linking without access token', async () => {
      mockRequest.query = {link: 'true'};
      mockRequest.cookies = {};

      await googleAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `${APP_ORIGIN}/profile/settings?error=session_expired`
      );
      expect(passport.authenticate).not.toHaveBeenCalled();
    });

    it('should redirect when linking with invalid access token', async () => {
      mockRequest.query = {link: 'true'};
      mockRequest.cookies = {accessToken: 'invalid-token'};

      await googleAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `${APP_ORIGIN}/profile/settings?error=session_expired`
      );
      expect(passport.authenticate).not.toHaveBeenCalled();
    });
  });

  describe('githubAuthController', () => {
    it('should initiate GitHub OAuth flow without linking', async () => {
      mockRequest.query = {};

      const mockAuthenticate = jest.fn((provider, options) => (req, res, next) => {
        expect(provider).toBe('github');
        expect(options.scope).toEqual(['read:user', 'user:email']);
        expect(options.session).toBe(false);
        expect(options.state).toBeUndefined();
      });

      (passport.authenticate as jest.Mock).mockImplementation(mockAuthenticate);

      await githubAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(passport.authenticate).toHaveBeenCalled();
    });

    it('should initiate GitHub OAuth flow with linking', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const sessionId = new mongoose.Types.ObjectId().toString();
      const accessToken = signToken({userId, sessionId});
      const mockOAuthLinkId = new mongoose.Types.ObjectId();

      mockRequest.query = {link: 'true'};
      mockRequest.cookies = {accessToken};

      (OAuthLink.create as jest.Mock).mockResolvedValue({_id: mockOAuthLinkId});

      const mockAuthenticate = jest.fn((provider, options) => (req, res, next) => {
        const state = JSON.parse(options.state);
        expect(state.link).toBe(true);
        expect(state.linkId).toBe(mockOAuthLinkId.toString());
      });

      (passport.authenticate as jest.Mock).mockImplementation(mockAuthenticate);

      await githubAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(OAuthLink.create).toHaveBeenCalledWith({userId});
      expect(passport.authenticate).toHaveBeenCalled();
    });

    it('should redirect when linking without access token', async () => {
      mockRequest.query = {link: 'true'};
      mockRequest.cookies = {};

      await githubAuthController(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `${APP_ORIGIN}/profile/settings?error=session_expired`
      );
      expect(passport.authenticate).not.toHaveBeenCalled();
    });
  });

  describe('Integration - Complete Authentication Flow', () => {
    it('should handle complete registration and verification flow', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const mockUser = {_id: 'user123', username: 'newuser', email: 'newuser@example.com'};
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      // Step 1: Register
      (createAccount as jest.Mock).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      mockRequest.body = registrationData;

      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_CREATED);

      // Step 2: Verify email
      jest.clearAllMocks();
      mockRequest.params = {code: '507f1f77bcf86cd799439011'};

      (verifyEmail as jest.Mock).mockResolvedValue(undefined);

      await verifyEmailController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle complete login and logout flow', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      // Step 1: Login
      mockRequest.body = {
        identifier: 'testuser',
        password: 'password123',
      };

      (loginUser as jest.Mock).mockResolvedValue(mockTokens);

      await loginController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Step 2: Logout
      jest.clearAllMocks();
      const sessionId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();
      const accessToken = signToken({userId, sessionId});

      mockRequest.cookies = {accessToken};

      (Session.findByIdAndDelete as jest.Mock).mockResolvedValue({_id: sessionId});

      await logoutController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.clearCookie).toHaveBeenCalled();
    });

    it('should handle complete password reset flow', async () => {
      // Step 1: Forgot password
      mockRequest.body = {email: 'test@example.com'};

      (forgotPassword as jest.Mock).mockResolvedValue(undefined);

      await forgotPasswordController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);

      // Step 2: Reset password
      jest.clearAllMocks();
      mockRequest.body = {
        verificationCode: '507f1f77bcf86cd799439011',
        password: 'newPassword456',
      };

      (resetPassword as jest.Mock).mockResolvedValue(undefined);

      await resetPasswordController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
      expect(mockResponse.clearCookie).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent registration attempts', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      (createAccount as jest.Mock)
        .mockResolvedValueOnce({
          user: {_id: 'user1'},
          accessToken: 'token1',
          refreshToken: 'refresh1',
        })
        .mockRejectedValueOnce(new AppError(HTTP_CONFLICT, 'Username already exists'));

      mockRequest.body = registrationData;

      // First request succeeds
      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_CREATED);

      // Second request fails
      jest.clearAllMocks();
      await registerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle special characters in credentials', async () => {
      mockRequest.body = {
        identifier: 'test+user@example.com',
        password: 'p@ssw0rd!#$%',
      };

      (loginUser as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await loginController(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(HTTP_OK);
    });

    it('should handle email with mixed case', async () => {
      mockRequest.body = {
        identifier: 'TeSt@ExAmPlE.CoM',
        password: 'password123',
      };

      (loginUser as jest.Mock).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await loginController(mockRequest, mockResponse, mockNext);

      expect(loginUser).toHaveBeenCalledWith({
        email: 'TeSt@ExAmPlE.CoM',
        password: 'password123',
      });
    });
  });
});
