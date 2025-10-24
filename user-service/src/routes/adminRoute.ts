import {Router} from 'express';
import {changeUserRoleController, createAdminAccountController} from '../controllers/adminHandler';

const adminRoutes = Router();

// Changes the role of the user with the provided username.
adminRoutes.patch('/users/:username/role', changeUserRoleController);

// Creates an admin account.
adminRoutes.post('/users', createAdminAccountController);

export default adminRoutes;
