import {Router} from 'express';
import {
  refreshController,
  registerController,
  verifyEmailHandler,
  loginController,
} from '../controllers/authController';

const authRoutes = Router();

authRoutes.get('/email/verify/:code', verifyEmailHandler);
authRoutes.get('/refresh', refreshController);

authRoutes.post('/register', registerController);
authRoutes.post('/login', loginController);

export default authRoutes;
