import sharp from 'sharp';
import {HTTP_BAD_REQUEST} from '../constants/httpStatus.ts';
import AppError from './appError.ts';

const IMAGE_DIMENSIONS = 400;

/**
 * Processes and optimizes a profile picture by validating dimensions.
 *     Resizes the image, converts it to JPEG and encodes it as a base64 data URI.
 *
 * @param buffer Raw image buffer to process.
 * @returns A base64-encoded data URI string of the processed image.
 * @throws {AppError} If the image is invalid, dimensions are below 400x400 pixels, or processing fails.
 */
export const processProfilePicture = async (buffer: Buffer): Promise<string> => {
  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new AppError(HTTP_BAD_REQUEST, 'Invalid image file!');
    }

    if (metadata.width < IMAGE_DIMENSIONS || metadata.height < IMAGE_DIMENSIONS) {
      throw new AppError(HTTP_BAD_REQUEST, 'Image must be at least 400x400 pixels');
    }

    const processedImage = await sharp(buffer)
      .resize(IMAGE_DIMENSIONS, IMAGE_DIMENSIONS, {
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
