import {OAUTH_LINK_MINS} from '../../constants/expirables';
import OAuthLink from '../../models/oAuthLink';
import User from '../../models/user';

describe('models/oAuthLink', () => {
  let testUserId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testUserId = user._id;
  });

  describe('Link creation', () => {
    it('should create a link with required fields', async () => {
      const oAuthLink = await OAuthLink.create({
        userId: testUserId,
      });

      expect(oAuthLink.userId).toEqual(testUserId);
      expect(oAuthLink.createdAt).toBeDefined();
      expect(oAuthLink.createdAt).toBeInstanceOf(Date);
      expect(oAuthLink.expiresAt).toBeDefined();
      expect(oAuthLink.expiresAt).toBeInstanceOf(Date);
    });

    it('should set default createdAt to current time', async () => {
      const beforeCreate = Date.now();
      const oAuthLink = await OAuthLink.create({
        userId: testUserId,
      });
      const afterCreate = Date.now();

      const createdTime = oAuthLink.createdAt.getTime();
      expect(createdTime).toBeGreaterThanOrEqual(beforeCreate);
      expect(createdTime).toBeLessThanOrEqual(afterCreate);
    });

    it('should set default expiresAt to OAUTH_LINK_MINS in future', async () => {
      const beforeCreate = Date.now();
      const oAuthLink = await OAuthLink.create({
        userId: testUserId,
      });
      const afterCreate = Date.now();

      const expectedMinExpiry = beforeCreate + OAUTH_LINK_MINS * 60 * 1000;
      const expectedMaxExpiry = afterCreate + OAUTH_LINK_MINS * 60 * 1000;
      const actualExpiry = oAuthLink.expiresAt.getTime();

      expect(actualExpiry).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(actualExpiry).toBeLessThanOrEqual(expectedMaxExpiry);
    });

    it('should allow custom expiresAt', async () => {
      const customExpiry = new Date(Date.now() + 7 * 60 * 1000);

      const oAuthLink = await OAuthLink.create({
        userId: testUserId,
        expiresAt: customExpiry,
      });

      expect(oAuthLink.expiresAt.getTime()).toBe(customExpiry.getTime());
    });

    it('should generate unique link Ids', async () => {
      const oAuthLink1 = await OAuthLink.create({userId: testUserId});
      const oAuthLink2 = await OAuthLink.create({userId: testUserId});

      expect(oAuthLink1._id.toString()).not.toBe(oAuthLink2._id.toString());
    });
  });

  describe('OAuthLink validation', () => {
    it('should require userId', async () => {
      const oAuthLinkData = {};

      await expect(OAuthLink.create(oAuthLinkData)).rejects.toThrow();
    });
  });

  describe('OAuthLink queries', () => {
    beforeEach(async () => {
      await OAuthLink.create([
        {userId: testUserId},
        {userId: testUserId},
        {
          userId: testUserId,
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      ]);
    });

    it('should find all links for a user', async () => {
      const oAuthLink = await OAuthLink.find({userId: testUserId});

      expect(oAuthLink.length).toBe(3);
      expect(oAuthLink.every(s => s.userId.equals(testUserId))).toBe(true);
    });

    it('should find links by Id', async () => {
      const createdOAuthLink = await OAuthLink.create({userId: testUserId});
      const foundOAuthLink = await OAuthLink.findById(createdOAuthLink._id);

      expect(foundOAuthLink).not.toBeNull();
      expect(foundOAuthLink._id.toString()).toBe(createdOAuthLink._id.toString());
    });

    it('should find active links (not expired)', async () => {
      const now = new Date();
      const activeoAuthLink = await OAuthLink.find({
        userId: testUserId,
        expiresAt: {$gt: now},
      });

      expect(activeoAuthLink.length).toBe(2);
      expect(activeoAuthLink.every(s => s.expiresAt > now)).toBe(true);
    });

    it('should find expired links', async () => {
      const now = new Date();
      const expiredoAuthLink = await OAuthLink.find({
        userId: testUserId,
        expiresAt: {$lte: now},
      });

      expect(expiredoAuthLink.length).toBe(1);
      expect(expiredoAuthLink.every(s => s.expiresAt <= now)).toBe(true);
    });
  });

  describe('OAuthLink deletion', () => {
    it('should delete links by ID', async () => {
      const oAuthLink = await OAuthLink.create({userId: testUserId});

      await OAuthLink.findByIdAndDelete(oAuthLink._id);

      const deletedOAuthLink = await OAuthLink.findById(oAuthLink._id);
      expect(deletedOAuthLink).toBeNull();
    });

    it('should delete all links for a user', async () => {
      await OAuthLink.create([{userId: testUserId}, {userId: testUserId}]);

      const result = await OAuthLink.deleteMany({userId: testUserId});

      expect(result.deletedCount).toBe(2);

      const remainingoAuthLink = await OAuthLink.find({userId: testUserId});
      expect(remainingoAuthLink.length).toBe(0);
    });

    it('should delete expired links', async () => {
      const now = new Date();

      await OAuthLink.create([
        {
          userId: testUserId,
          expiresAt: new Date(now.getTime() - 1000),
        },
        {
          userId: testUserId,
          expiresAt: new Date(now.getTime() - 2000),
        },
      ]);

      const result = await OAuthLink.deleteMany({
        expiresAt: {$lte: now},
      });

      expect(result.deletedCount).toBe(2);
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

      await OAuthLink.create([
        {userId: testUserId},
        {userId: testUserId},
        {userId: user2Id},
        {userId: user3Id},
      ]);
    });

    it('should isolate links by user', async () => {
      const user1oAuthLink = await OAuthLink.find({userId: testUserId});
      const user2oAuthLink = await OAuthLink.find({userId: user2Id});
      const user3oAuthLink = await OAuthLink.find({userId: user3Id});

      expect(user1oAuthLink.length).toBe(2);
      expect(user2oAuthLink.length).toBe(1);
      expect(user3oAuthLink.length).toBe(1);
    });

    it('should delete only target user links', async () => {
      await OAuthLink.deleteMany({userId: testUserId});

      const remainingUser1 = await OAuthLink.find({userId: testUserId});
      const remainingUser2 = await OAuthLink.find({userId: user2Id});
      const remainingUser3 = await OAuthLink.find({userId: user3Id});

      expect(remainingUser1.length).toBe(0);
      expect(remainingUser2.length).toBe(1);
      expect(remainingUser3.length).toBe(1);
    });

    it('should count links across all users', async () => {
      const totaloAuthLink = await OAuthLink.countDocuments();

      expect(totaloAuthLink).toBe(4);
    });
  });

  describe('Others', () => {
    it('should handle concurrent link creation', async () => {
      const promises = Array.from({length: 10}, () => OAuthLink.create({userId: testUserId}));

      const oAuthLink = await Promise.all(promises);

      expect(oAuthLink.length).toBe(10);
      expect(new Set(oAuthLink.map(s => s._id.toString())).size).toBe(10);
    });
  });
});
