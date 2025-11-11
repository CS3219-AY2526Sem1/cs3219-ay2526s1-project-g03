import {parse} from 'cookie';

export const parseCookies = (cookieHeader: string): Record<string, string> => {
  return parse(cookieHeader);
};
