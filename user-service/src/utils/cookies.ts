import type {Response, CookieOptions} from 'express';
import {NODE_ENV} from '../constants/env';
import {daysFromNow, minutesFromNow} from './date';
import {AUTH_TOKEN_MINS, REFRESH_TOKEN_DAYS} from '../constants/expirables';

const secure = NODE_ENV !== 'development';
export const REFRESH_PATH = '/auth/refresh';

const defaults: CookieOptions = {
  sameSite: 'strict',
  httpOnly: true,
  secure,
};

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: daysFromNow(REFRESH_TOKEN_DAYS),
  path: '/auth/refresh',
});

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: minutesFromNow(AUTH_TOKEN_MINS),
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({res, accessToken, refreshToken}: Params) =>
  res
    .cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions())
    .cookie('accessToken', accessToken, getAccessTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
  res.clearCookie('refreshToken', {path: REFRESH_PATH}).clearCookie('accessToken');
