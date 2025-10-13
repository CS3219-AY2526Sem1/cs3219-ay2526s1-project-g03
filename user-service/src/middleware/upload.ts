import multer from 'multer';
import AppError from '../utils/appError.ts';
import {HTTP_BAD_REQUEST} from '../constants/httpStatus.ts';
import {PROFILE_PIC_MAX_SIZE} from '../constants/userParams.ts';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError(HTTP_BAD_REQUEST, 'Only image files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: PROFILE_PIC_MAX_SIZE,
  },
});
