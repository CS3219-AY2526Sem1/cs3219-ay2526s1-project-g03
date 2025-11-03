import mongoose from 'mongoose';
import {REFRESH_TOKEN_DAYS} from '../../constants/expirables';
import Session from '../../models/session';
import User from '../../models/user';

describe('models/session', () => {
  let testUserId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testUserId = user._id;
  });

  describe('Session creation', () => {
    it('should create a session with required fields', async () => {
      const session = await Session.create({
        userId: testUserId,
      });

      expect(session.userId).toEqual(testUserId);
      expect(session.createdAt).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('should set default createdAt to current time', async () => {
      const beforeCreate = Date.now();
      const session = await Session.create({
        userId: testUserId,
      });
      const afterCreate = Date.now();

      const createdTime = session.createdAt.getTime();
      expect(createdTime).toBeGreaterThanOrEqual(beforeCreate);
      expect(createdTime).toBeLessThanOrEqual(afterCreate);
    });

    it('should set default expiresAt to REFRESH_TOKEN_DAYS in future', async () => {
      const beforeCreate = Date.now();
      const session = await Session.create({
        userId: testUserId,
      });
      const afterCreate = Date.now();

      const expectedMinExpiry = beforeCreate + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
      const expectedMaxExpiry = afterCreate + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
      const actualExpiry = session.expiresAt.getTime();

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(actualExpiry).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    it('should allow custom expiresAt', async () => {
      const customExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const session = await Session.create({
        userId: testUserId,
        expiresAt: customExpiry,
      });

      expect(session.expiresAt.getTime()).toBe(customExpiry.getTime());
    });
  });

  describe('Session validation', () => {
    it('should require userId', async () => {
      const sessionData = {};

      await expect(Session.create(sessionData)).rejects.toThrow();
    });
  });

  describe('Session queries', () => {
    let createdSession;

    beforeEach(async () => {
      createdSession = await Session.create({userId: testUserId});
    });

    it('should find session by Id', async () => {
      const foundSession = await Session.findById(createdSession._id);

      expect(foundSession._id.toString()).toBe(createdSession._id.toString());
    });

    it('should find active sessions (not expired)', async () => {
      const now = new Date();
      const activeSessions = await Session.find({
        userId: testUserId,
        expiresAt: {$gt: now},
      });

      expect(activeSessions.length).toBe(1);
      expect(activeSessions.every(s => s.expiresAt > now)).toBe(true);
    });

    it('should find expired sessions', async () => {
      const now = new Date();

      createdSession.expiresAt = new Date(Date.now() - 1000);
      await createdSession.save();

      const expiredSessions = await Session.find({
        userId: testUserId,
        expiresAt: {$lte: now},
      });

      expect(expiredSessions.length).toBe(1);
      expect(expiredSessions.every(s => s.expiresAt <= now)).toBe(true);
    });
  });

  describe('Session deletion', () => {
    it('should delete session by ID', async () => {
      const session = await Session.create({userId: testUserId});

      await Session.findByIdAndDelete(session._id);

      const deletedSession = await Session.findById(session._id);
      expect(deletedSession).toBeNull();
    });

    it('should delete all sessions for a user', async () => {
      await Session.create({userId: testUserId});

      const result = await Session.deleteMany({userId: testUserId});

      expect(result.deletedCount).toBe(1);

      const remainingSessions = await Session.find({userId: testUserId});
      expect(remainingSessions.length).toBe(0);
    });

    it('should delete expired sessions', async () => {
      const now = new Date();

      await Session.create([
        {
          userId: testUserId,
          expiresAt: new Date(now.getTime() - 2000),
        },
      ]);

      const result = await Session.deleteMany({
        expiresAt: {$lte: now},
      });

      expect(result.deletedCount).toBe(1);
    });
  });

  describe('Multiple users', () => {
    let user2Id;
    let user3Id;

    beforeEach(async () => {
      const user2 = await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
      });
      const user3 = await User.create({
        username: 'user3',
        email: 'user3@example.com',
        password: 'password123',
      });
      user2Id = user2._id;
      user3Id = user3._id;

      await Session.create([{userId: testUserId}, {userId: user2Id}, {userId: user3Id}]);
    });

    it('should isolate sessions by user', async () => {
      const user1Sessions = await Session.find({userId: testUserId});
      const user2Sessions = await Session.find({userId: user2Id});
      const user3Sessions = await Session.find({userId: user3Id});

      expect(user1Sessions.length).toBe(1);
      expect(user2Sessions.length).toBe(1);
      expect(user3Sessions.length).toBe(1);
    });

    it('should delete only target user sessions', async () => {
      await Session.deleteMany({userId: testUserId});

      const remainingUser1 = await Session.find({userId: testUserId});
      const remainingUser2 = await Session.find({userId: user2Id});
      const remainingUser3 = await Session.find({userId: user3Id});

      expect(remainingUser1.length).toBe(0);
      expect(remainingUser2.length).toBe(1);
      expect(remainingUser3.length).toBe(1);
    });

    it('should count sessions across all users', async () => {
      const totalSessions = await Session.countDocuments();

      expect(totalSessions).toBe(3);
    });
  });

  describe('Others', () => {
    it('should handle concurrent session creation', async () => {
      const promises = Array.from({length: 10}, (_, i) =>
        Session.create({
          userId: new mongoose.Types.ObjectId(),
        })
      );

      const sessions = await Promise.all(promises);

      expect(sessions.length).toBe(10);
      expect(new Set(sessions.map(s => s._id.toString())).size).toBe(10);
    });
  });
});
