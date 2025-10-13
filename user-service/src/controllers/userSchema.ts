import {z, type ZodRawShape} from 'zod';
import {
  MAX_PW_LEN,
  MAX_USERNAME_LEN,
  MIN_PW_LEN,
  MIN_USERNAME_LEN,
  MONGO_MAX_ID_LEN,
  MONGO_MIN_ID_LEN,
} from '../constants/userParams.ts';
import {OCCUPATIONS} from '../constants/occupations.ts';
import {AREAS_OF_STUDY} from '../constants/areaOfStudy.ts';

// Source: https://zod.dev/api

const nameSchema = z
  .string()
  .min(1, {message: 'Name cannot be empty'})
  .max(50, {message: 'Name too long'})
  .regex(/^[\p{L} .'\-]+$/u, {
    message: 'Name contains invalid characters',
  });

const usernameSchema = z
  .string()
  .min(MIN_USERNAME_LEN, {
    message: `username must be at least ${MIN_USERNAME_LEN} characters long!`,
  })
  .max(MAX_USERNAME_LEN, {
    message: `username cannot be more than ${MAX_USERNAME_LEN} characters long!`,
  })
  .regex(/^[a-zA-Z0-9_]+$/, {message: `username can only contain alphanumerics and underscores!`});

export const emailSchema = z.email();

const passwordSchema = z
  .string()
  .min(MIN_PW_LEN, {message: `password must be at least ${MIN_PW_LEN} long!`})
  .max(MAX_PW_LEN, {message: `password cannot be more than ${MAX_PW_LEN} long!`});

export const usernameAndEmail = z.object({
  username: usernameSchema,
  email: emailSchema,
});

export const usernameOrEmail = z.object({
  identifier: z.string().min(1, {message: 'Invalid username or email!'}),
});

export function validateUsernameOrEmail<T extends ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.refine(
    data => {
      const isEmail = emailSchema.safeParse(data.identifier).success;
      const isUsername = usernameSchema.safeParse(data.identifier).success;
      return isEmail || isUsername;
    },
    {
      message: 'Must be a valid username or email',
      path: ['identifier'],
    }
  );
}

export const passwordAndConfirmPassword = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
});

export function validatePwAndCfmPw<T extends ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.refine(val => val.password === val.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });
}

/**
 * Zod schema for validating user registration input.
 *
 * {string} username String, 3 - 30 characters, only alphanumerics and underscores.
 * {string} email Valid email string provided by Zod.
 * {string} password 8 - 30 characters.
 * {string} confirmPassword 8 - 30 characters, must match password.
 */
export const registerSchema = validatePwAndCfmPw(
  usernameAndEmail.extend(passwordAndConfirmPassword.shape)
);

/**
 * Zod schema for validating user login input.
 * Source: https://zod.dev/api
 *
 * {string} identifier Either a valid username or email.
 * {string} password 8 - 30 characters.
 */
export const loginSchema = validateUsernameOrEmail(
  usernameOrEmail.extend({
    password: passwordSchema,
  })
);

/**
 * Zod schema for validating change of username or password.
 */
export const changeUsernameOrEmailSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine(data => data.username || data.email, {
    message: 'Either username or email should be changed',
    path: ['username'],
  });

/**
 * Zod schema for validating change of password.
 */
export const changePwSchema = validatePwAndCfmPw(
  passwordAndConfirmPassword.extend({
    currentPassword: passwordSchema,
  })
);

/**
 * Zod schema for validating MongoDB verification code.
 */
export const verificationCodeSchema = z.string().min(MONGO_MIN_ID_LEN).max(MONGO_MAX_ID_LEN);

/**
 * Zod schema for validating password reset request input.
 *
 * {string} verificationCode MongoDB identifier.
 * {string} password User password.
 */
export const passwordResetSchema = z.object({
  verificationCode: verificationCodeSchema,
  password: passwordSchema,
});

export const changePersonalInfoSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  occupation: z.enum(OCCUPATIONS),
  areaOfStudy: z.enum(AREAS_OF_STUDY),
});
