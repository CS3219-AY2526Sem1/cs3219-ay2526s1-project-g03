import catchErrors from '../utils/catchErrors';
import {HTTP_CREATED, HTTP_OK} from '../constants/httpStatus';
import {createAccount, verifyEmail} from '../services/authService';
import {registerSchema, verificationCodeSchema} from './authSchema';

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
  console.log('I am at the start!');
  const verificationCode = verificationCodeSchema.parse(req.params.code);
  console.log('I got in here!');
  await verifyEmail(verificationCode);
  return res.status(HTTP_OK).json({
    message: 'Email was successfully verified!',
  });
});
