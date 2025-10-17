import jwt from 'jsonwebtoken';
import {JWT_REFRESH_SECRET, JWT_SECRET} from '../../constants/env';
import {ACCESS_TOKEN_MINS, REFRESH_TOKEN_DAYS} from '../../constants/expirables';
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from '../../utils/jwt';

jest.mock('../../constants/env', () => ({
  JWT_SECRET: 'test-secret', // MOCK_JWT_SERCRET
  JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET', // MOCK_JWT_REFRESH_SECRET
}));

jest.mock('../../constants/expirables', () => ({
  ACCESS_TOKEN_MINS: 15, // MOCK_ACCESS_TOKEN_MINS
  REFRESH_TOKEN_DAYS: 30, // MOCK_REFRESH_TOKEN_DAYS
}));

const MOCK_JWT_SERCRET = 'test-secret';
const MOCK_JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET';
const MOCK_ACCESS_TOKEN_MINS = 15;
const MOCK_REFRESH_TOKEN_DAYS = 30;

describe('utils/jwt', () => {
  const mockSessionId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439012';

  describe('signToken', () => {
    it('should sign an access token', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(mockUserId);
      expect(decoded.sessionId).toBe(mockSessionId);
      expect(decoded.aud).toEqual(['user']);
    });

    it('should sign a refresh token', () => {
      const payload: RefreshTokenPayload = {
        sessionId: mockSessionId,
      };

      const token = signToken(payload, refreshTokenSignOptions);

      expect(token).toBeDefined();

      const decoded = jwt.decode(token) as any;
      expect(decoded.sessionId).toBe(mockSessionId);
      expect(decoded.aud).toEqual(['user']);
    });

    it('should use correct expiration for access token', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = signToken(payload);
      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedMax = now + MOCK_ACCESS_TOKEN_MINS * 60;

      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeLessThanOrEqual(expectedMax);
      expect(decoded.exp).toBeGreaterThan(now);
    });

    it('should use correct expiration for refresh token', () => {
      const payload: RefreshTokenPayload = {
        sessionId: mockSessionId,
      };

      const token = signToken(payload, refreshTokenSignOptions);
      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedMax = now + MOCK_REFRESH_TOKEN_DAYS * 24 * 60 * 60;

      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeLessThanOrEqual(expectedMax);
      expect(decoded.exp).toBeGreaterThan(now);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = signToken(payload);
      const result = verifyToken(token);

      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('payload');
      expect(result.payload).toHaveProperty('userId');
      expect(result.payload?.userId).toBe(mockUserId);
      expect(result.payload).toHaveProperty('sessionId');
      expect(result.payload?.sessionId).toBe(mockSessionId);
    });

    it('should verify a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        sessionId: mockSessionId,
      };

      const token = signToken(payload, refreshTokenSignOptions);
      const result = verifyToken<RefreshTokenPayload>(token, {
        secret: JWT_REFRESH_SECRET,
      });

      expect(result).not.toHaveProperty('error');
      expect(result).toHaveProperty('payload');
      expect(result.payload).not.toHaveProperty('userId');
      expect(result.payload).toHaveProperty('sessionId');
      expect(result.payload?.sessionId).toBe(mockSessionId);
    });

    it('should return error for invalid token', () => {
      const result = verifyToken('invalid-token');

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('jwt malformed');
      expect(result).not.toHaveProperty('payload');
    });

    it('should return error for token with wrong secret', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = signToken(payload);
      const result = verifyToken(token, {secret: 'wrong-secret'});

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('invalid signature');
      expect(result).not.toHaveProperty('payload');
    });

    it('should return error for expired token', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '0s',
        audience: ['user'],
      });

      // Delay to ensure expiry.
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        const result = verifyToken(token);

        expect(result).toHaveProperty('error');
        expect(result.error).toContain('jwt expired');
        expect(result).not.toHaveProperty('payload');
      });
    });

    it('should return error for token with invalid audience', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      // Create token with different audience
      const token = jwt.sign(payload, JWT_SECRET, {
        audience: ['admin'],
      });

      const result = verifyToken(token);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('jwt audience invalid');
      expect(result).not.toHaveProperty('payload');
    });

    it('should handle empty token', () => {
      const result = verifyToken('');

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('jwt must be provided');
      expect(result).not.toHaveProperty('payload');
    });
  });

  describe('Token Options', () => {
    it('should have correct access token configuration', () => {
      expect(accessTokenSignOptions.expiresIn).toBe(`${ACCESS_TOKEN_MINS}m`);
      expect(accessTokenSignOptions.secret).toBe(JWT_SECRET);
    });

    it('should have correct refresh token configuration', () => {
      expect(refreshTokenSignOptions.expiresIn).toBe(`${REFRESH_TOKEN_DAYS}d`);
      expect(refreshTokenSignOptions.secret).toBe(JWT_REFRESH_SECRET);
    });
  });

  describe('End to end', () => {
    it('should create and verify access token', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = signToken(payload);
      const result = verifyToken(token);

      expect(result.payload).toEqual(
        expect.objectContaining({
          userId: mockUserId,
          sessionId: mockSessionId,
        })
      );
    });

    it('should create and verify refresh token', () => {
      const payload: RefreshTokenPayload = {
        sessionId: mockSessionId,
      };

      const token = signToken(payload, refreshTokenSignOptions);
      const result = verifyToken<RefreshTokenPayload>(token, {
        secret: JWT_REFRESH_SECRET,
      });

      expect(result.payload).toEqual(
        expect.objectContaining({
          sessionId: mockSessionId,
        })
      );
    });

    it('should fail when verifying access token with refresh secret', () => {
      const payload: AccessTokenPayload = {
        userId: mockUserId,
        sessionId: mockSessionId,
      };

      const token = signToken(payload);
      const result = verifyToken(token, {secret: JWT_REFRESH_SECRET});

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('invalid signature');
    });

    it('should fail when verifying refresh token with access secret', () => {
      const payload: RefreshTokenPayload = {
        sessionId: mockSessionId,
      };

      const token = signToken(payload, refreshTokenSignOptions);
      const result = verifyToken(token);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('invalid signature');
    });
  });
});
