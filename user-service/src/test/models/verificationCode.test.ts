import VerificationType from '../../constants/verificationTypes';
import User from '../../models/user';
import VerificationCode from '../../models/verificationCode';

describe('models/verificationCode', () => {
  const TEST_EXPIRY_BEFORE = new Date(Date.now() - 1000000);
  const TEST_EXPIRY = new Date(Date.now() + 1000000);
  const TEST_EXPIRY_AFTER = new Date(Date.now() + 2000000);
  let testUserId;

  beforeEach(async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    testUserId = user._id;
  });

  describe('VerificationCode creation', () => {
    it('should create a verification code with required fields', async () => {
      const verificationCode = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      expect(verificationCode.userId).toEqual(testUserId);
      expect(verificationCode.type).toBe(VerificationType.VerifyEmail);
      expect(verificationCode.expiresAt).toEqual(TEST_EXPIRY);
      expect(verificationCode).toHaveProperty('createdAt');
      expect(verificationCode.createdAt).toBeInstanceOf(Date);
    });

    it('should set default createdAt to current time', async () => {
      const beforeCreate = Date.now();

      const verificationCode = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      const afterCreate = Date.now();

      const createdTime = verificationCode.createdAt.getTime();
      expect(createdTime).toBeGreaterThanOrEqual(beforeCreate);
      expect(createdTime).toBeLessThanOrEqual(afterCreate);
    });

    it('should generate unique IDs for verification codes', async () => {
      const code1 = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      const code2 = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      expect(code1._id.toString()).not.toBe(code2._id.toString());
    });
  });

  describe('Verification types', () => {
    it('should create VerifyEmail type', async () => {
      const code = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      expect(code.type).toBe(VerificationType.VerifyEmail);
    });

    it('should create ResetPassword type', async () => {
      const code = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.ResetPassword,
        expiresAt: TEST_EXPIRY,
      });

      expect(code.type).toBe(VerificationType.ResetPassword);
    });

    it('should allow different types for same user', async () => {
      const emailCode = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      const passwordCode = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.ResetPassword,
        expiresAt: TEST_EXPIRY,
      });

      expect(emailCode.type).toBe(VerificationType.VerifyEmail);
      expect(passwordCode.type).toBe(VerificationType.ResetPassword);
    });
  });

  describe('Verification validation', () => {
    it('should require userId', async () => {
      const codeData = {
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      };

      await expect(VerificationCode.create(codeData)).rejects.toThrow();
    });

    it('should require type', async () => {
      const codeData = {
        userId: testUserId,
        expiresAt: TEST_EXPIRY,
      };

      await expect(VerificationCode.create(codeData)).rejects.toThrow();
    });

    it('should require expiresAt', async () => {
      const codeData = {
        userId: testUserId,
        type: VerificationType.VerifyEmail,
      };

      await expect(VerificationCode.create(codeData)).rejects.toThrow();
    });

    it('should require valid ObjectId for userId', async () => {
      const codeData = {
        userId: 'invalid-id',
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      };

      await expect(VerificationCode.create(codeData)).rejects.toThrow();
    });

    it('should require date for expiresAt', async () => {
      const codeData = {
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: 'not-a-date',
      };

      await expect(VerificationCode.create(codeData)).rejects.toThrow();
    });

    it('should require date for createdAt', async () => {
      const codeData = {
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        createdAt: 'not-a-date',
        expiresAt: new Date(),
      };

      await expect(VerificationCode.create(codeData)).rejects.toThrow();
    });
  });

  describe('User reference', () => {
    it('should create multiple codes for same user', async () => {
      const code1 = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      const code2 = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      expect(code1.userId).toEqual(testUserId);
      expect(code2.userId).toEqual(testUserId);
      expect(code1._id.toString()).not.toBe(code2._id.toString());
    });
  });

  describe('VerificationCode queries', () => {
    beforeEach(async () => {
      const now = Date.now();

      await VerificationCode.create([
        {
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: TEST_EXPIRY,
        },
        {
          userId: testUserId,
          type: VerificationType.ResetPassword,
          expiresAt: TEST_EXPIRY_AFTER,
        },
        {
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: TEST_EXPIRY_BEFORE, // Expired
        },
      ]);
    });

    it('should find all codes for a user', async () => {
      const codes = await VerificationCode.find({userId: testUserId});

      expect(codes.length).toBe(3);
      expect(codes.every(c => c.userId.equals(testUserId))).toBe(true);
    });

    it('should find code by Id', async () => {
      const createdCode = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      const foundCode = await VerificationCode.findById(createdCode._id);

      expect(foundCode).not.toBeNull();
      expect(foundCode._id.toString()).toBe(createdCode._id.toString());
    });

    it('should find codes by type', async () => {
      const emailCodes = await VerificationCode.find({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
      });

      expect(emailCodes.length).toBe(2);
      expect(emailCodes.every(c => c.type === VerificationType.VerifyEmail)).toBe(true);
    });

    it('should find valid codes (non-expired)', async () => {
      const now = new Date();
      const validCodes = await VerificationCode.find({
        userId: testUserId,
        expiresAt: {$gt: now},
      });

      expect(validCodes.length).toBe(2);
      expect(validCodes.every(c => c.expiresAt > now)).toBe(true);
    });

    it('should find expired codes', async () => {
      const now = new Date();
      const expiredCodes = await VerificationCode.find({
        userId: testUserId,
        expiresAt: {$lte: now},
      });

      expect(expiredCodes.length).toBe(1);
      expect(expiredCodes.every(c => c.expiresAt <= now)).toBe(true);
    });
  });

  describe('VerificationCode deletion', () => {
    it('should delete code by ID', async () => {
      const code = await VerificationCode.create({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
        expiresAt: TEST_EXPIRY,
      });

      await VerificationCode.findByIdAndDelete(code._id);

      const deletedCode = await VerificationCode.findById(code._id);
      expect(deletedCode).toBeNull();
    });

    it('should delete all codes for a user', async () => {
      await VerificationCode.create([
        {
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: TEST_EXPIRY,
        },
        {
          userId: testUserId,
          type: VerificationType.ResetPassword,
          expiresAt: TEST_EXPIRY,
        },
      ]);

      const result = await VerificationCode.deleteMany({userId: testUserId});

      expect(result.deletedCount).toBe(2);

      const remainingCodes = await VerificationCode.find({userId: testUserId});
      expect(remainingCodes.length).toBe(0);
    });

    it('should delete expired codes', async () => {
      const now = new Date();

      await VerificationCode.create([
        {
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: TEST_EXPIRY_BEFORE,
        },
        {
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: new Date(now),
        },
      ]);

      const result = await VerificationCode.deleteMany({
        expiresAt: {$lte: now},
      });

      expect(result.deletedCount).toBe(2);
    });

    it('should delete codes by type', async () => {
      await VerificationCode.create([
        {
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: TEST_EXPIRY,
        },
        {
          userId: testUserId,
          type: VerificationType.ResetPassword,
          expiresAt: TEST_EXPIRY,
        },
      ]);

      const result = await VerificationCode.deleteMany({
        userId: testUserId,
        type: VerificationType.VerifyEmail,
      });

      expect(result.deletedCount).toBe(1);

      const remainingCodes = await VerificationCode.find({userId: testUserId});
      expect(remainingCodes.every(c => c.type === VerificationType.ResetPassword)).toBe(true);
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

      await VerificationCode.create([
        {userId: testUserId, type: VerificationType.VerifyEmail, expiresAt: TEST_EXPIRY},
        {userId: testUserId, type: VerificationType.ResetPassword, expiresAt: TEST_EXPIRY},
        {userId: user2Id, type: VerificationType.VerifyEmail, expiresAt: TEST_EXPIRY},
        {userId: user3Id, type: VerificationType.ResetPassword, expiresAt: TEST_EXPIRY},
      ]);
    });

    it('should isolate codes by user', async () => {
      const user1Codes = await VerificationCode.find({userId: testUserId});
      const user2Codes = await VerificationCode.find({userId: user2Id});
      const user3Codes = await VerificationCode.find({userId: user3Id});

      expect(user1Codes.length).toBe(2);
      expect(user2Codes.length).toBe(1);
      expect(user3Codes.length).toBe(1);
    });

    it('should delete only target user codes', async () => {
      await VerificationCode.deleteMany({userId: testUserId});

      const remainingUser1 = await VerificationCode.find({userId: testUserId});
      const remainingUser2 = await VerificationCode.find({userId: user2Id});
      const remainingUser3 = await VerificationCode.find({userId: user3Id});

      expect(remainingUser1.length).toBe(0);
      expect(remainingUser2.length).toBe(1);
      expect(remainingUser3.length).toBe(1);
    });

    it('should count codes across all users', async () => {
      const totalCodes = await VerificationCode.countDocuments();

      expect(totalCodes).toBe(4);
    });

    it('should find codes by type across users', async () => {
      const emailCodes = await VerificationCode.find({
        type: VerificationType.VerifyEmail,
      });
      const passwordCodes = await VerificationCode.find({
        type: VerificationType.ResetPassword,
      });

      expect(emailCodes.length).toBe(2);
      expect(passwordCodes.length).toBe(2);
    });
  });

  describe('Others', () => {
    it('should handle concurrent code creation', async () => {
      const promises = Array.from({length: 10}, () =>
        VerificationCode.create({
          userId: testUserId,
          type: VerificationType.VerifyEmail,
          expiresAt: TEST_EXPIRY,
        })
      );

      const codes = await Promise.all(promises);

      expect(codes.length).toBe(10);
      expect(new Set(codes.map(c => c._id.toString())).size).toBe(10);
    });
  });
});
