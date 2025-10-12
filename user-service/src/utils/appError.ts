import type {HttpStatusCode} from '../constants/httpStatus';

class AppError extends Error {
  constructor(
    public statusCode: HttpStatusCode,
    public message: string
  ) {
    super(message);
  }
}

export default AppError;
