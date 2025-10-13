import {z} from 'zod';

const MIN_UN_LENGTH = 3;
const MAX_UN_LENGTH = 30;
const MIN_PW_LENGTH = 8;
const MAX_PW_LENGTH = 30;

const MONGO_MIN_ID_LENGTH = 1;
const MONGO_MAX_ID_LENGTH = 24;

const usernameSchema = z
  .string()
  .min(MIN_UN_LENGTH)
  .max(MAX_UN_LENGTH)
  .regex(/[a-zA-Z0-9_]+/);
export const emailSchema = z.email();
const passwordSchema = z.string().min(MIN_PW_LENGTH).max(MAX_PW_LENGTH);

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
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(val => val.password === val.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

export const verificationCodeSchema = z.string().min(MONGO_MIN_ID_LENGTH).max(MONGO_MAX_ID_LENGTH);

export const passwordResetSchema = z.object({
  verificationCode: verificationCodeSchema,
  password: passwordSchema,
});

/**
 * Zod schema for validating user login input.
 * Source: https://zod.dev/api
 *
 * {string} identifier Either a valid username or email.
 * {string} password 8 - 30 characters.
 */
export const loginSchema = z
  .object({
    identifier: z.string().min(1),
    password: passwordSchema,
  })
  .refine(data => {
    const isEmail = emailSchema.safeParse(data.identifier).success;
    const isUsername = usernameSchema.safeParse(data.identifier).success;
    return isEmail || isUsername;
  });
