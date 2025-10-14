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
} from '../controllers/authHandler.ts';

const authRoutes = Router();

authRoutes.get('/email/verify/:code', verifyEmailController);
authRoutes.get('/refresh', refreshController);
authRoutes.get('/logout', logoutController);

authRoutes.post('/register', registerController);
authRoutes.post('/login', loginController);
authRoutes.post('/email/resend', resendEmailController);
authRoutes.post('/password/forgot', forgotPasswordController);
authRoutes.post('/password/reset', resetPasswordController);

authRoutes.get('/google', googleAuthController);
authRoutes.get('/google/callback', googleCallbackController);

authRoutes.get('/github', githubAuthController);
authRoutes.get('/github/callback', githubCallbackController);

export default authRoutes;
