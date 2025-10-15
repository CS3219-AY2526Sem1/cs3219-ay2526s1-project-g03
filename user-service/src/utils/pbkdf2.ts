import crypto from 'crypto';
import {promisify} from 'util';

// FIPS compliancy
const ITERATIONS = 600000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';
const SALT_LENGTH = 16;

const pbkdf2Async = promisify(crypto.pbkdf2);
const randomBytesAsync = promisify(crypto.randomBytes);

// Code adapted from https://ssojet.com/hashing/pbkdf2-in-nodejs/

interface HashResult {
  hash: string;
  salt: string;
  iterations: number;
  algorithm: string;
}

/**
 * Hash password asynchronously following FIPS-140 compliance.
 *
 * @param password Plain text password.
 * @returns Hash result with salt and metadata.
 */
const hashPassword = async (password: string): Promise<HashResult> => {
  try {
    const salt = await randomBytesAsync(SALT_LENGTH);
    const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

    return {
      hash: hash.toString('hex'),
      salt: salt.toString('hex'),
      iterations: ITERATIONS,
      algorithm: `pbkdf2-${DIGEST}`,
    };
  } catch (error) {
    throw new Error(
      `Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}$`
    );
  }
};

/**
 * Verifies the PBKDF2 derived key.
 *
 * @param password Plain text password.
 * @param storedHash Stored hash.
 * @param storedSalt Stored salt.
 * @param iterations Number of iterations used.
 * @returns True if password matches, else false.
 */
const verifyPassword = async (
  password: string,
  storedHash: string,
  storedSalt: string,
  iterations: number = ITERATIONS
): Promise<boolean> => {
  try {
    const salt = Buffer.from(storedSalt, 'hex');
    const hash = await pbkdf2Async(password, salt, iterations, KEY_LENGTH, DIGEST);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(hash, storedHashBuffer);
  } catch (error) {
    console.error('Password verification error:', error);
    return false; // Assume false.
  }
};

const needsRehash = (storedIterations: number): boolean => storedIterations < ITERATIONS;

export {hashPassword, needsRehash, verifyPassword};
