import type {NextFunction, Request, Response} from 'express';

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wrapper to automatically catch async errors.
 *
 * @param {AsyncController} controller Async controller function to be wrapped.
 * @returns {AsyncController} Wrapped controller that forwards errors to middleware.
 */
const catchErrors =
  (controller: AsyncController): AsyncController =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export default catchErrors;
