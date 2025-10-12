import {Router} from 'express';
import {getUserHandler} from '../controllers/userController';

const userRoutes = Router();

userRoutes.get('/', getUserHandler);

export default userRoutes;
