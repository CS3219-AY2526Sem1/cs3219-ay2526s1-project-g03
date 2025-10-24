import mongoose from 'mongoose';
import {JWT_REFRESH_SECRET, MONGO_URI} from '../../constants/env';
import {REFRESH_BUFFER_DAYS, REFRESH_TOKEN_DAYS} from '../../constants/expirables';
import Session from '../../models/session';
import User from '../../models/user';
import {
  createSession,
  generateTokensForSession,
  renewSessionIfNeeded,
} from '../../services/sessionService';
import AppError from '../../utils/appError';
import {daysFromNow} from '../../utils/date';
import {verifyToken} from '../../utils/jwt';

describe('services/sessionService', () => {
  let testUserId;
  let testUser;

  let user2Id;
  let user2;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testUserId = testUser._id.toString();

    user2 = await User.create({
      username: 'user2',
      email: 'user2@example.com',
      password: 'password123',
    });
    user2Id = user2._id.toString();
  });

  describe('createSession', () => {
    it('should set expiration date', async () => {
      const beforeCreate = Date.now();
      const session = await createSession(testUserId);
      const afterCreate = Date.now();

      const expectedMinExpiry = beforeCreate + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
      const expectedMaxExpiry = afterCreate + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
      const actualExpiry = session.expiresAt.getTime();

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(actualExpiry).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    it('should handle concurrent session creation', async () => {
      await createSession(testUserId); // Registration
      const promises = [
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
        createSession(testUserId),
      ];

      await Promise.all(promises);

      const sessions = await Session.find({userId: testUserId});
      expect(sessions.length).toBe(1);
    });

    it('should create sessions for different users', async () => {
      const session1 = await createSession(testUserId);
      const session2 = await createSession(user2._id.toString());

      expect(session1.userId.toString()).toBe(testUserId);
      expect(session2.userId.toString()).toBe(user2Id);

      const user1Sessions = await Session.find({userId: testUserId});
      const user2Sessions = await Session.find({userId: user2Id});

      expect(user1Sessions.length).toBe(1);
      expect(user2Sessions.length).toBe(1);
    });

    it('should return session with valid ObjectId', async () => {
      const session = await createSession(testUserId);

      expect(session._id).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(mongoose.Types.ObjectId.isValid(session._id as any)).toBe(true);
    });
  });

  describe('generateTokensForSession', () => {
    it('should generate both valid access and refresh tokens', async () => {
      const sessionId = new mongoose.Types.ObjectId().toString();
      const {accessToken, refreshToken} = generateTokensForSession(testUserId, sessionId);

      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');

      const {payload: accessPayload} = verifyToken(accessToken);

      expect(accessPayload).toBeDefined();
      expect(accessPayload.userId).toBe(testUserId);
      expect(accessPayload.sessionId).toBe(sessionId);

      const {payload: refreshPayload} = verifyToken(refreshToken, {
        secret: JWT_REFRESH_SECRET,
      });

      expect(refreshPayload).toBeDefined();
      expect((refreshPayload as any).sessionId).toBe(sessionId);
    });

    it('should generate different tokens for different sessions', () => {
      const sessionId1 = new mongoose.Types.ObjectId().toString();
      const sessionId2 = new mongoose.Types.ObjectId().toString();

      const tokens1 = generateTokensForSession(testUserId, sessionId1);
      const tokens2 = generateTokensForSession(testUserId, sessionId2);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it('should generate different tokens for different users', () => {
      const sessionId = new mongoose.Types.ObjectId().toString();

      const tokens1 = generateTokensForSession(testUserId, sessionId);
      const tokens2 = generateTokensForSession(user2Id, sessionId);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
    });
  });

  describe('renewSessionIfNeeded', () => {
    it('should not renew session outside range of REFRESH_BUFFER_DAYS', async () => {
      const session = await Session.create({
        userId: testUserId,
        expiresAt: daysFromNow(20),
      });

      const newToken = await renewSessionIfNeeded(session);

      expect(newToken).toBeNull();
    });

    it('should renew session within range of REFRESH_BUFFER_DAYS', async () => {
      const expiresAt = daysFromNow(REFRESH_BUFFER_DAYS);

      const session = await Session.create({
        userId: testUserId,
        expiresAt,
      });

      const beforeCreate = Date.now();
      const newToken = await renewSessionIfNeeded(session);
      const afterCreate = Date.now();

      expect(newToken).not.toBeNull();
      expect(typeof newToken).toBe('string');

      // New expiry date
      const updatedSession = await Session.findById(session._id);

      const expectedMinExpiry = beforeCreate + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
      const expectedMaxExpiry = afterCreate + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
      const actualExpiry = updatedSession.expiresAt.getTime();

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(actualExpiry).toBeLessThanOrEqual(expectedMaxExpiry);

      // Correct refresh token
      const {payload, error} = verifyToken(newToken!, {
        secret: JWT_REFRESH_SECRET,
      });

      expect(error).toBeUndefined();
      expect(payload).toBeDefined();
      expect((payload as any).sessionId).toBe(session._id.toString());
    });

    it('should throw error for expired session', async () => {
      const session = await Session.create({
        userId: testUserId,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      await expect(renewSessionIfNeeded(session)).rejects.toThrow(AppError);
      await expect(renewSessionIfNeeded(session)).rejects.toThrow('Session expired!');
    });
  });

  describe('Others', () => {
    it('should handle rapid session creation and deletion', async () => {
      for (let i = 0; i < 10; i++) {
        const session = await createSession(testUserId);
        await Session.findByIdAndDelete(session._id.toString());
      }

      const sessions = await Session.find({userId: testUserId});
      expect(sessions.length).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      await mongoose.connection.close();

      await expect(createSession(testUserId)).rejects.toThrow();

      await mongoose.connect(MONGO_URI);
    });
  });
});
