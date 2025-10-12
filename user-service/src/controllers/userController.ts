import {HTTP_NOT_FOUND, HTTP_OK} from '../constants/httpStatus';
import User from '../models/user';
import appAssert from '../utils/appAssert';
import catchErrors from '../utils/catchErrors';

export const getUserHandler = catchErrors(async (req, res) => {
  const user = await User.findById(req.userId);
  appAssert(user, HTTP_NOT_FOUND, 'User not found!');
  return res.status(HTTP_OK).json(user);
});
