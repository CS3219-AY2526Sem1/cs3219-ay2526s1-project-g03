import type {HttpStatusCode} from '../constants/httpStatus';

/**
 * Wrapper for application errors.
 */
class AppError extends Error {
  constructor(
    public statusCode: HttpStatusCode,
    public message: string
  ) {
    super(message);
  }
}

export default AppError;
