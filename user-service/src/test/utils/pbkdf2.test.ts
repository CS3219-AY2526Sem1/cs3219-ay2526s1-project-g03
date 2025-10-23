import {hashPassword, verifyPassword, needsRehash} from '../../utils/pbkdf2';

// FIPS compliancy
const EXPECTED_ITERATIONS = 600000;
const EXPECTED_HASH_LENGTH = 32 * 2;
const EXPECTED_DIGEST = 'pbkdf2-sha256';
const EXPECTED_SALT_LENGTH = 16 * 2;

describe('utils/pbkdf2', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const result = await hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result.hash).toHaveLength(EXPECTED_HASH_LENGTH);
      expect(result).toHaveProperty('salt');
      expect(result.salt).toHaveLength(EXPECTED_SALT_LENGTH);
      expect(result).toHaveProperty('iterations');
      expect(result.iterations).toBe(EXPECTED_ITERATIONS);
      expect(result).toHaveProperty('algorithm');
      expect(result.algorithm).toBe(EXPECTED_DIGEST);
    });

    it('should generate different salts for same password', async () => {
      const password = 'samePassword';
      const result1 = await hashPassword(password);
      const result2 = await hashPassword(password);

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should hash empty password without throwing error', async () => {
      const result = await hashPassword('');

      expect(result).toHaveProperty('hash');
      expect(result.hash).toHaveLength(EXPECTED_HASH_LENGTH);
      expect(result).toHaveProperty('salt');
      expect(result.salt).toHaveLength(EXPECTED_SALT_LENGTH);
      expect(result).toHaveProperty('iterations');
      expect(result.iterations).toBe(EXPECTED_ITERATIONS);
      expect(result).toHaveProperty('algorithm');
      expect(result.algorithm).toBe(EXPECTED_DIGEST);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'correctPassword';
      const {hash, salt, iterations} = await hashPassword(password);

      const isValid = await verifyPassword(password, hash, salt, iterations);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'correctPassword';
      const {hash, salt, iterations} = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash, salt, iterations);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const isValid = await verifyPassword('password', 'invalid', `${EXPECTED_SALT_LENGTH / 2}`);
      expect(isValid).toBe(false);
    });

    it('should handle invlaid salt gracefully', async () => {
      const isValid = await verifyPassword('password', `${EXPECTED_HASH_LENGTH / 2}`, 'invalid');
      expect(isValid).toBe(false);
    });

    it('should fail when wrong iterations are passed', async () => {
      const isValid = await verifyPassword(
        'password',
        `${EXPECTED_HASH_LENGTH / 2}`,
        `${EXPECTED_SALT_LENGTH / 2}`,
        EXPECTED_ITERATIONS / 2
      );
      expect(isValid).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('should return true for old iteration count', () => {
      expect(needsRehash(100000)).toBe(true);
    });

    it('should return false for current iteration count', () => {
      expect(needsRehash(600000)).toBe(false);
    });
  });
});
