import assert from 'node:assert';
import type {HttpStatusCode} from '../constants/httpStatus';
import AppError from './appError';

type AppAssert = (
  condition: any,
  httpStatusCode: HttpStatusCode,
  message: string
) => asserts condition;

const appAssert: AppAssert = (condition, httpStatusCode, message) =>
  assert(condition, new AppError(httpStatusCode, message));

export default appAssert;
