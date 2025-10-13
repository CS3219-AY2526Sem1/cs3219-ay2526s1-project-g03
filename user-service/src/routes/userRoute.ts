import {Router} from 'express';
import {
  changePasswordHandler,
  changePersonalInfoController,
  changeProfilePictureController,
  changeUsernameOrEmailController,
  getUserController,
  markAccountForDeletionController,
} from '../controllers/userHandler.ts';
import {upload} from '../middleware/upload.ts';

const userRoutes = Router();

userRoutes.get('/', getUserController);
userRoutes.delete('/delete', markAccountForDeletionController);

userRoutes.patch('/profile/usernameoremail', changeUsernameOrEmailController);
userRoutes.patch(
  '/profile/picture',
  upload.single('profilePicture'),
  changeProfilePictureController
);
userRoutes.patch('/profile/password', changePasswordHandler);
userRoutes.patch('/profile/personalInfo', changePersonalInfoController);

export default userRoutes;
