import sharp from 'sharp';
import AppError from './appError.ts';
import {HTTP_BAD_REQUEST} from '../constants/httpStatus.ts';

export const processProfilePicture = async (buffer: Buffer): Promise<string> => {
  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new AppError(HTTP_BAD_REQUEST, 'Invalid image file!');
    }

    if (metadata.width < 400 || metadata.height < 400) {
      throw new AppError(HTTP_BAD_REQUEST, 'Image must be at least 400x400 pixels');
    }

    const processedImage = await sharp(buffer)
      .resize(400, 400, {
        position: 'center',
      })
      .jpeg()
      .toBuffer();

    return `data:image/jpeg;base64, ${processedImage.toString('base64')}`;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(HTTP_BAD_REQUEST, 'Failed to process image');
  }
};
