import {z} from 'zod';
import catchErrors from '../utils/catchErrors';
import {HTTP_CREATED} from '../constants/httpStatus';
import {createAccount} from '../services/authService';

/**
 * Zod schema for validating user registration input.
 * Source: https://zod.dev/api
 *
 * {string} username String, 3 - 30 characters, only alphanumerics and underscores.
 * {string} email Valid email string provided by Zod.
 * {string} password 8 - 30 characters.
 * {string} confirmPassword 8 - 30 characters, must match password.
 */
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/[a-zA-Z0-9_]+/),
    email: z.email(),
    password: z.string().min(8).max(30),
    confirmPassword: z.string().min(8).max(30),
  })
  .refine(val => val.password === val.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

/**
 * Handles POST request for user registration (`POST /auth/register`).
 * Validates request body using `registerSchema`.
 *
 * @param {Request} req - Express request object containing request details.
 * @param {Response} res - Express response object for sending the error response.
 */
export const registerController = catchErrors(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
  });

  const user = await createAccount(request);

  return res.status(HTTP_CREATED).json(user);
});
