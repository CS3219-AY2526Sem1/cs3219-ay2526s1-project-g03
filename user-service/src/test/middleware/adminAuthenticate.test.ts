import mongoose from 'mongoose';
import {HTTP_FORBIDDEN, HTTP_UNAUTHORIZED} from '../../constants/httpStatus';
import adminAuthenticate from '../../middleware/adminAuthenticate';
import User from '../../models/user';
import AppError from '../../utils/appError';

describe('middleware/adminAuthenticate', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    adminUser = await User.create({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    regularUser = await User.create({
      username: 'regularuser',
      email: 'regular@example.com',
      password: 'password123',
      role: 'user',
    });

    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('Successful admin authentication', () => {
    it('should allow admin user to proceed', async () => {
      mockRequest.userId = adminUser._id.toString();

      await adminAuthenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unsuccessful admin authentication', () => {
    it('should block regular user', async () => {
      mockRequest.userId = regularUser._id.toString();

      await adminAuthenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(HTTP_FORBIDDEN);
      expect(error.message).toBe('Unauthorized');
    });

    it('should block when user not found', async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      mockRequest.userId = fakeUserId;

      await adminAuthenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
      expect(error.message).toBe('Unauthorized');
    });

    it('should block when userId is undefined', async () => {
      mockRequest.userId = undefined;

      await adminAuthenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
      expect(error.message).toBe('Unauthorized');
    });

    it('should block when userId is null', async () => {
      mockRequest.userId = null;

      await adminAuthenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
      expect(error.message).toBe('Unauthorized');
    });
  });
});
