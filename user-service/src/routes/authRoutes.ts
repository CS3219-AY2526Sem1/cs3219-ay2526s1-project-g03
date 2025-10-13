import {Router} from 'express';
import {
  refreshController,
  registerController,
  verifyEmailHandler,
  loginController,
} from '../controllers/authController';
import {
  forgotPasswordController,
  logoutController,
  resendEmailController,
  resetPasswordController,
} from '../controllers/authController.ts';

const authRoutes = Router();

authRoutes.get('/email/verify/:code', verifyEmailHandler);
authRoutes.get('/refresh', refreshController);
authRoutes.get('/logout', logoutController);

authRoutes.post('/register', registerController);
authRoutes.post('/login', loginController);
authRoutes.post('/email/resend', resendEmailController);
authRoutes.post('/password/forgot', forgotPasswordController);
authRoutes.post('/password/reset', resetPasswordController);

export default authRoutes;
