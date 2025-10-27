import multer from 'multer';
import {HTTP_BAD_REQUEST} from '../constants/httpStatus';
import {PROFILE_PIC_MAX_SIZE} from '../constants/userParams';
import AppError from '../utils/appError';

const storage = multer.memoryStorage();

/**
 * File filter to validate that only image files are uploaded.
 *
 * @param req Express request object.
 * @param file Uploaded file object.
 * @param cb Callback function to accept or reject the file.
 */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError(HTTP_BAD_REQUEST, 'Only image files are allowed!'), false);
  }
};

/**
 * Multer upload middleware configured for profile picture uploads.
 * Stores files in memory, validates image mime types, and enforces size limits.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: PROFILE_PIC_MAX_SIZE,
  },
});
