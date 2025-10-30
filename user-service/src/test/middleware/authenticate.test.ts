import mongoose from 'mongoose';
import {HTTP_UNAUTHORIZED} from '../../constants/httpStatus';
import authenticate from '../../middleware/authenticate';
import Session from '../../models/session';
import User from '../../models/user';
import AppError from '../../utils/appError';
import {signToken} from '../../utils/jwt';

describe('middleware/authenticate', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  let testUser;
  let testSession;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    testSession = await Session.create({
      userId: testUser._id,
    });

    mockRequest = {
      cookies: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('Successful authentication', () => {
    it('should authenticate with valid access token', async () => {
      const accessToken = signToken({
        userId: testUser._id.toString(),
        sessionId: testSession._id.toString(),
      });

      mockRequest.cookies = {accessToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.userId).toBe(testUser._id.toString());
      expect(mockRequest.sessionId).toBe(testSession._id.toString());
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should verify session exists in database', async () => {
      const accessToken = signToken({
        userId: testUser._id.toString(),
        sessionId: testSession._id.toString(),
      });

      mockRequest.cookies = {accessToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      const session = await Session.findById(testSession._id);
      expect(session).not.toBeNull();
    });
  });

  describe('Invalid / Missing access token', () => {
    it('should fail when no cookies provided', async () => {
      mockRequest.cookies = {};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail when accessToken cookie is undefined', async () => {
      mockRequest.cookies = {accessToken: undefined};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail when accessToken cookie is null', async () => {
      mockRequest.cookies = {accessToken: null};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail when accessToken cookie is empty string', async () => {
      mockRequest.cookies = {accessToken: ''};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail with malformed token', async () => {
      mockRequest.cookies = {accessToken: 'malformed-token'};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail with tampered token', async () => {
      const accessToken = signToken({
        userId: testUser._id.toString(),
        sessionId: testSession._id.toString(),
      });

      // Randomly edit token
      const tamperedToken = accessToken.slice(0, -5) + 'xxxxx';
      mockRequest.cookies = {accessToken: tamperedToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail with token signed with wrong secret', async () => {
      const fakeToken = signToken(
        {
          userId: testUser._id.toString(),
          sessionId: testSession._id.toString(),
        },
        {secret: 'wrong-secret', expiresIn: '15m'}
      );

      mockRequest.cookies = {accessToken: fakeToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail with expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        {
          userId: testUser._id.toString(),
          sessionId: testSession._id.toString(),
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '0s',
          audience: ['pp-user-service'],
        }
      );

      // Wait for token to expire.
      await new Promise(resolve => setTimeout(resolve, 100));

      mockRequest.cookies = {accessToken: expiredToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail with token having invalid audience', async () => {
      const jwt = require('jsonwebtoken');
      const wrongAudienceToken = jwt.sign(
        {
          userId: testUser._id.toString(),
          sessionId: testSession._id.toString(),
        },
        process.env.JWT_SECRET,
        {
          audience: ['random-user'],
        }
      );

      mockRequest.cookies = {accessToken: wrongAudienceToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });
  });

  describe('Session validation', () => {
    it('should fail when session does not exist', async () => {
      const nonExistentSessionId = new mongoose.Types.ObjectId().toString();
      const accessToken = signToken({
        userId: testUser._id.toString(),
        sessionId: nonExistentSessionId,
      });

      mockRequest.cookies = {accessToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should fail when session is deleted after token issued', async () => {
      const accessToken = signToken({
        userId: testUser._id.toString(),
        sessionId: testSession._id.toString(),
      });

      // Delete session
      await Session.findByIdAndDelete(testSession._id);

      mockRequest.cookies = {accessToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });

    it('should validate session belongs to correct user', async () => {
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
      });

      const anotherSession = await Session.create({
        userId: anotherUser._id,
      });

      // Token with mismatched user and session
      const accessToken = signToken({
        userId: testUser._id.toString(),
        sessionId: anotherSession._id.toString(),
      });

      mockRequest.cookies = {accessToken};

      await authenticate(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Invalid access token!');
      expect(error.statusCode).toBe(HTTP_UNAUTHORIZED);
    });
  });
});
