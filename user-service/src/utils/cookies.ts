import type {CookieOptions, Response} from 'express';
import {NODE_ENV} from '../constants/env';
import {ACCESS_TOKEN_MINS, REFRESH_TOKEN_DAYS} from '../constants/expirables';
import {daysFromNow, minutesFromNow} from './date';

// Adapted from: https://github.com/nikitapryymak/mern-auth-jwt/blob/youtube/backend/src/utils/cookies.ts

const secure = NODE_ENV !== 'development';
export const REFRESH_PATH = '/auth/refresh';

const defaults: CookieOptions = {
  sameSite: 'strict',
  httpOnly: true,
  secure,
};

/**
 * Refresh token options, specifically sets the expiration date and the path to check.
 *
 * @returns Options for the refresh token.
 */
export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: daysFromNow(REFRESH_TOKEN_DAYS),
  path: REFRESH_PATH,
});

/**
 * Access token options, specifically adds the expiration date.
 *
 * @returns Options for the access token.
 */
export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: minutesFromNow(ACCESS_TOKEN_MINS),
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

/**
 * Sets authentication cookies, both refresh and access tokens.
 *
 * @param res HTTP Response.
 * @param accessToken Access token to set.
 * @param refreshToken Refresh token to set.
 * @returns The response object with authentication cookies set.
 */
export const setAuthCookies = ({res, accessToken, refreshToken}: Params) =>
  res
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
    .cookie('accessToken', accessToken, getAccessTokenCookieOptions());

/**
 * Clears both authentication and refresh token cookies.
 *
 * @param res HTTP response.
 * @returns The response object with authentication cookies cleared.
 */
export const clearAuthCookies = (res: Response) =>
  res.clearCookie('refreshToken', {path: REFRESH_PATH}).clearCookie('accessToken');
