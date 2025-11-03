import {HTTP_OK} from '../constants/httpStatus';
import {changeUserRole, createAdminAccount} from '../services/adminService';
import catchErrors from '../utils/catchErrors';
import {changeRoleSchema, usernameAndEmail} from './userSchema';

/**
 * Changes the role of an existing user.
 */
export const changeUserRoleController = catchErrors(async (req, res) => {
  const {username} = req.params;
  const request = changeRoleSchema.parse(req.body);
  await changeUserRole(username, request.role);
  return res.status(HTTP_OK).json({
    message: 'User role updated successfully',
  });
});

/**
 * Creates a new admin account.
 */
export const createAdminAccountController = catchErrors(async (req, res) => {
  const request = usernameAndEmail.parse(req.body);
  await createAdminAccount(request.username, request.email);

  return res.status(HTTP_OK).json({
    message: 'Admin account created successfully. Password reset email sent.',
  });
});
