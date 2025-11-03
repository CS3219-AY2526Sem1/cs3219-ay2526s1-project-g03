import {Router} from 'express';
import {
  forgotPasswordController,
  githubAuthController,
  githubCallbackController,
  googleAuthController,
  googleCallbackController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  resendEmailController,
  resetPasswordController,
  verifyEmailController,
} from '../controllers/authHandler';

const authRoutes = Router();

// Verifies verification email credentials.
authRoutes.get('/email/verify/:code', verifyEmailController);
// Refreshes tokens.
authRoutes.get('/refresh', refreshController);
// Log out a user from the application.
authRoutes.get('/logout', logoutController);

// Registers a new user account.
authRoutes.post('/register', registerController);
// Logs a user into the application.
authRoutes.post('/login', loginController);
// Resends a verifcation email.
authRoutes.post('/email/resend', resendEmailController);
// Sends a forgot password email.
authRoutes.post('/password/forgot', forgotPasswordController);
// Resets the password of a user.
authRoutes.post('/password/reset', resetPasswordController);

// Google OAuth.
authRoutes.get('/google', googleAuthController);
// Google OAuth callback upon successful authentication.
authRoutes.get('/google/callback', googleCallbackController);

// GitHub OAuth.
authRoutes.get('/github', githubAuthController);
// GitHub OAuth callback upon successful authentication.
authRoutes.get('/github/callback', githubCallbackController);

export default authRoutes;
