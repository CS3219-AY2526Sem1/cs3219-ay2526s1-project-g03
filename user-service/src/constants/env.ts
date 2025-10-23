import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

// Solution adapted from:
// https://stackoverflow.com/questions/64383909/dirname-is-not-defined-error-in-node-js-14-version
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config({path: path.resolve(dirname, '../../../.env')});

/**
 * Processes all environment variables.
 *
 * @param {string} key - The name of the environment variable to retrieve.
 * @param {string} [defaultValue] - Optional fallback value if no environment variable is provided.
 * @returns {string} Environment variable value.
 * @throws {Error} If the environment variable is missing and no default value is provided.
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`${key} environment variable is missing!`);
  }

  return value;
};

export const NODE_ENV = getEnv('NODE_ENV', 'development');
export const USER_SERVICE_PORT = getEnv('USER_SERVICE_PORT', '8080');
export const MONGO_URI = getEnv('MONGO_URI');
export const APP_ORIGIN = getEnv('APP_ORIGIN');

export const JWT_SECRET = getEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET');

export const EMAIL_SENDER = getEnv('EMAIL_SENDER');
export const RESEND_API_KEY = getEnv('RESEND_API_KEY');

export const ADMIN_USERNAME = getEnv('ADMIN_USERNAME');
export const ADMIN_EMAIL = getEnv('ADMIN_EMAIL');
export const ADMIN_PASSWORD = getEnv('ADMIN_PASSWORD');

export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');
export const GOOGLE_AUTH_ORIGIN = getEnv('GOOGLE_AUTH_ORIGIN');
export const GOOGLE_AUTH_REDIR_URI = getEnv('GOOGLE_AUTH_REDIR_URI');

export const GITHUB_CLIENT_ID = getEnv('GITHUB_CLIENT_ID');
export const GITHUB_CLIENT_SECRET = getEnv('GITHUB_CLIENT_SECRET');
export const GITHUB_AUTH_ORIGIN = getEnv('GITHUB_AUTH_ORIGIN');
export const GITHUB_AUTH_REDIR_URI = getEnv('GITHUB_AUTH_REDIR_URI');
