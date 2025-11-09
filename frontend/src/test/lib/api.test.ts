// AI Assistance Disclosure:
// Tool: Claude 4.5 Sonnet (Anthropic)
// Date: 2025-10-25
// Scope: Generated comprehensive test cases
// Author review: Tests validated for correctness and fixed test logic where applicable.

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  },
}));

import API from '../../config/apiClient';
import {
  changePassword,
  changePersonalInfo,
  changeProfilePic,
  changeUsernameOrEmail,
  changeUserRole,
  createAdminAccount,
  deleteAccount,
  deleteProfilePic,
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resendEmail,
  resetPassword,
  unlinkOAuthProvider,
  verifyEmail,
} from '../../lib/api';

describe('lib/api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should call register endpoint', async () => {
      const mockData = {username: 'test', email: 'test@test.com', password: 'password'};
      (API.post as jest.Mock).mockResolvedValue({data: mockData});

      await register(mockData);

      expect(API.post).toHaveBeenCalledWith('/auth/register', mockData);
    });

    it('should call login endpoint', async () => {
      const mockData = {identifier: 'test', password: 'password'};
      (API.post as jest.Mock).mockResolvedValue({data: mockData});

      await login(mockData);

      expect(API.post).toHaveBeenCalledWith('auth/login', mockData);
    });

    it('should call logout endpoint', async () => {
      (API.get as jest.Mock).mockResolvedValue({});

      await logout();

      expect(API.get).toHaveBeenCalledWith('auth/logout');
    });
  });

  describe('Email verification', () => {
    it('should call verifyEmail endpoint with code', async () => {
      const code = 'abc123';
      (API.get as jest.Mock).mockResolvedValue({});

      await verifyEmail(code);

      expect(API.get).toHaveBeenCalledWith(`/auth/email/verify/${code}`);
    });

    it('should call resendEmail endpoint', async () => {
      const mockData = {email: 'test@test.com'};
      (API.post as jest.Mock).mockResolvedValue({});

      await resendEmail(mockData);

      expect(API.post).toHaveBeenCalledWith('auth/email/resend', mockData);
    });
  });

  describe('Password management', () => {
    it('should call forgotPassword endpoint', async () => {
      const mockData = {email: 'test@test.com'};
      (API.post as jest.Mock).mockResolvedValue({});

      await forgotPassword(mockData);

      expect(API.post).toHaveBeenCalledWith('/auth/password/forgot', mockData);
    });

    it('should call resetPassword endpoint', async () => {
      const mockData = {verificationCode: 'abc', password: 'newpass'};
      (API.post as jest.Mock).mockResolvedValue({});

      await resetPassword(mockData);

      expect(API.post).toHaveBeenCalledWith('/auth/password/reset', mockData);
    });

    it('should call changePassword endpoint', async () => {
      const mockData = {currentPassword: 'old', password: 'new'};
      (API.patch as jest.Mock).mockResolvedValue({});

      await changePassword(mockData);

      expect(API.patch).toHaveBeenCalledWith('/user/profile/password', mockData);
    });
  });

  describe('User profile', () => {
    it('should call getUser and return data', async () => {
      const mockUser = {id: '1', username: 'test'};
      (API.get as jest.Mock).mockResolvedValue({data: mockUser});

      const result = await getUser();

      expect(API.get).toHaveBeenCalledWith('/user', {withCredentials: true});
      expect(result).toEqual(mockUser);
    });

    it('should call changeUsernameOrEmail endpoint', async () => {
      const mockData = {username: 'newuser'};
      (API.patch as jest.Mock).mockResolvedValue({});

      await changeUsernameOrEmail(mockData);

      expect(API.patch).toHaveBeenCalledWith('/user/profile/usernameoremail', mockData);
    });

    it('should call changeProfilePic with FormData', async () => {
      const mockFormData = new FormData();
      const mockResponse = {data: {url: 'image.jpg'}};
      (API.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await changeProfilePic(mockFormData);

      expect(API.patch).toHaveBeenCalledWith('/user/profile/picture', mockFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call deleteProfilePic endpoint', async () => {
      (API.patch as jest.Mock).mockResolvedValue({});

      await deleteProfilePic();

      expect(API.patch).toHaveBeenCalledWith('/user/profile/picture', {delete: 'true'});
    });

    it('should call changePersonalInfo endpoint', async () => {
      const mockData = {firstName: 'John', lastName: 'Doe'};
      (API.patch as jest.Mock).mockResolvedValue({});

      await changePersonalInfo(mockData);

      expect(API.patch).toHaveBeenCalledWith('/user/profile/personalinfo', mockData);
    });

    it('should call deleteAccount endpoint', async () => {
      const mockData = {password: 'password'};
      (API.delete as jest.Mock).mockResolvedValue({});

      await deleteAccount(mockData);

      expect(API.delete).toHaveBeenCalledWith('/user/delete', {data: mockData});
    });
  });

  describe('OAuth', () => {
    it('should call unlinkOAuthProvider for google', async () => {
      (API.delete as jest.Mock).mockResolvedValue({});

      await unlinkOAuthProvider('google');

      expect(API.delete).toHaveBeenCalledWith('/user/oauth/google');
    });

    it('should call unlinkOAuthProvider for github', async () => {
      (API.delete as jest.Mock).mockResolvedValue({});

      await unlinkOAuthProvider('github');

      expect(API.delete).toHaveBeenCalledWith('/user/oauth/github');
    });
  });

  describe('Admin', () => {
    it('should call changeUserRole endpoint', async () => {
      const username = 'testuser';
      const role = 'admin';
      (API.patch as jest.Mock).mockResolvedValue({});

      await changeUserRole(username, role);

      expect(API.patch).toHaveBeenCalledWith(`/admin/users/${username}/role`, {role});
    });

    it('should call createAdminAccount endpoint', async () => {
      const mockData = {username: 'admin', email: 'admin@test.com'};
      (API.post as jest.Mock).mockResolvedValue({});

      await createAdminAccount(mockData);

      expect(API.post).toHaveBeenCalledWith('/admin/users', mockData);
    });
  });
});
