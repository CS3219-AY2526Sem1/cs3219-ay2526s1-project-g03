/**
 * Constants for all HTTP response status codes
 * Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
 */

export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_NOT_FOUND = 404;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

export type HttpStatusCode =
  | typeof HTTP_OK
  | typeof HTTP_CREATED
  | typeof HTTP_BAD_REQUEST
  | typeof HTTP_UNAUTHORIZED
  | typeof HTTP_NOT_FOUND
  | typeof HTTP_INTERNAL_SERVER_ERROR;
