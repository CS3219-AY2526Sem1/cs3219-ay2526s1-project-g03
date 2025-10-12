import {Router} from 'express';
import {registerController, verifyEmailHandler} from '../controllers/authController';

const authRoutes = Router();

authRoutes.post('/register', registerController);
authRoutes.get('/email/verify/:code', verifyEmailHandler);

export default authRoutes;
