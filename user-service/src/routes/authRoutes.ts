import {Router} from 'express';
import {
  registerController,
  verifyEmailHandler,
  loginController,
} from '../controllers/authController';

const authRoutes = Router();

authRoutes.post('/register', registerController);
authRoutes.get('/email/verify/:code', verifyEmailHandler);
authRoutes.post('/login', loginController);

export default authRoutes;
