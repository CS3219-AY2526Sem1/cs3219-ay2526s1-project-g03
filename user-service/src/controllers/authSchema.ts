import {z} from 'zod';

const MIN_UN_LENGTH = 3;
const MAX_UN_LENGTH = 30;
const MIN_PW_LENGTH = 8;
const MAX_PW_LENGTH = 30;

const MONGO_MIN_ID_LENGTH = 1;
const MONGO_MAX_ID_LENGTH = 24;

/**
 * Zod schema for validating user registration input.
 * Source: https://zod.dev/api
 *
 * {string} username String, 3 - 30 characters, only alphanumerics and underscores.
 * {string} email Valid email string provided by Zod.
 * {string} password 8 - 30 characters.
 * {string} confirmPassword 8 - 30 characters, must match password.
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(MIN_UN_LENGTH)
      .max(MAX_UN_LENGTH)
      .regex(/[a-zA-Z0-9_]+/),
    email: z.email(),
    password: z.string().min(MIN_PW_LENGTH).max(MAX_PW_LENGTH),
    confirmPassword: z.string().min(MIN_PW_LENGTH).max(MAX_PW_LENGTH),
  })
  .refine(val => val.password === val.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

export const verificationCodeSchema = z.string().min(MONGO_MIN_ID_LENGTH).max(MONGO_MAX_ID_LENGTH);
