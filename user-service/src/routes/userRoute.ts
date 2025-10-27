import {Router} from 'express';
import {
  changePasswordHandler,
  changePersonalInfoController,
  changeProfilePictureController,
  changeUsernameOrEmailController,
  getUserController,
  markAccountForDeletionController,
  unlinkOAuthController,
} from '../controllers/userHandler';
import {upload} from '../middleware/upload';

const userRoutes = Router();

// Gets a particular user.
userRoutes.get('/', getUserController);
// Marks a user account for deletion.
userRoutes.delete('/delete', markAccountForDeletionController);

// Updates the username and/or email of the user.
userRoutes.patch('/profile/usernameoremail', changeUsernameOrEmailController);
// Updates the profile picture of the user.
userRoutes.patch(
  '/profile/picture',
  upload.single('profilePicture'),
  changeProfilePictureController
);
// Updates the password of the user.
userRoutes.patch('/profile/password', changePasswordHandler);
// Updates personal particulars of the user.
userRoutes.patch('/profile/personalInfo', changePersonalInfoController);

// Unlinks a particular OAuth of a user.
userRoutes.delete('/oauth/:provider', unlinkOAuthController);

export default userRoutes;
