import appAssert from '../../utils/appAssert';
import AppError from '../../utils/appError';
import {
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
  HTTP_CONFLICT,
  HTTP_INTERNAL_SERVER_ERROR,
} from '../../constants/httpStatus';

describe('utils/appAssert', () => {
  describe('Truthy conditions', () => {
    const SHOULD_NOT_TRHOW_MSG = 'This should not throw';
    it('should not throw when condition is true', () => {
      expect(() => {
        appAssert(true, HTTP_BAD_REQUEST, SHOULD_NOT_TRHOW_MSG);
      }).not.toThrow();
    });

    it('should not throw when condition is truthy string', () => {
      expect(() => {
        appAssert('non-empty', HTTP_BAD_REQUEST, SHOULD_NOT_TRHOW_MSG);
      }).not.toThrow();
    });

    it('should not throw when condition is truthy number', () => {
      expect(() => {
        appAssert(1, HTTP_BAD_REQUEST, SHOULD_NOT_TRHOW_MSG);
      }).not.toThrow();
    });

    it('should not throw when condition is truthy object', () => {
      expect(() => {
        appAssert({key: 'value'}, HTTP_BAD_REQUEST, SHOULD_NOT_TRHOW_MSG);
      }).not.toThrow();
    });

    it('should not throw when condition is truthy array', () => {
      expect(() => {
        appAssert([1, 2, 3], HTTP_BAD_REQUEST, SHOULD_NOT_TRHOW_MSG);
      }).not.toThrow();
    });
  });

  describe('Falsy conditions', () => {
    const SHOULD_THROW_MSG = 'This should throw';
    it('should throw AppError when condition is false', () => {
      expect(() => {
        appAssert(false, HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
      }).toThrow(AppError);
    });

    it('should throw with correct properties', () => {
      try {
        appAssert(false, HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(HTTP_UNAUTHORIZED);
        expect((error as AppError).message).toBe(SHOULD_THROW_MSG);
      }
    });

    it('should throw when condition is null', () => {
      expect(() => {
        appAssert(null, HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
      }).toThrow(AppError);
    });

    it('should throw when condition is undefined', () => {
      expect(() => {
        appAssert(undefined, HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
      }).toThrow(AppError);
    });

    it('should throw when condition is 0', () => {
      expect(() => {
        appAssert(0, HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
      }).toThrow(AppError);
    });

    it('should throw when condition is empty string', () => {
      expect(() => {
        appAssert('', HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
      }).toThrow(AppError);
    });

    it('should throw when condition is NaN', () => {
      expect(() => {
        appAssert(NaN, HTTP_UNAUTHORIZED, SHOULD_THROW_MSG);
      }).toThrow(AppError);
    });
  });
});
