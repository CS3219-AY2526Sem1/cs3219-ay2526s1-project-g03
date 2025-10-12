import z from 'zod';
import catchErrors from '../utils/catchErrors';
import {HTTP_CREATED, HTTP_OK} from '../constants/httpStatus';
import {createAccount, verifyEmail, loginUser} from '../services/authService';
import {registerSchema, verificationCodeSchema, loginSchema} from './authSchema';

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

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);
  await verifyEmail(verificationCode);
  return res.status(HTTP_OK).json({
    message: 'Email was successfully verified!',
  });
});

export const loginController = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
  });

  const isEmail = z.email().safeParse(request.identifier).success;

  const loginData = isEmail
    ? {email: request.identifier, password: request.password}
    : {username: request.identifier, password: request.password};

  const {} = await loginUser(loginData);

  return res.status(HTTP_OK).json({
    message: 'Login successful!',
  });
});
