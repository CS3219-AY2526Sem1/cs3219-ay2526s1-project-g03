import {Router} from 'express';
import {
  changeUserRoleController,
  createAdminAccountController,
} from '../controllers/adminHandler.ts';

const adminRoutes = Router();

adminRoutes.patch('/users/:username/role', changeUserRoleController);
adminRoutes.post('/users', createAdminAccountController);

export default adminRoutes;
