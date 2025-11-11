import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

// Solution adapted from:
// https://stackoverflow.com/questions/64383909/dirname-is-not-defined-error-in-node-js-14-version
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

dotenv.config({path: path.resolve(dirname, '../../.env')});

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
export const MATCHING_SERVICE_PORT = getEnv('MATCHING_SERVICE_PORT', '8081');
export const APP_ORIGIN = getEnv('APP_ORIGIN');
export const REDIS_HOST = getEnv('REDIS_HOST', 'redish');
export const REDIS_PORT = getEnv('REDIS_PORT', '6379');
export const COLLAB_SERVICE_URL = getEnv('COLLABORATION_SERVICE_URL', 'http://localhost:8082')