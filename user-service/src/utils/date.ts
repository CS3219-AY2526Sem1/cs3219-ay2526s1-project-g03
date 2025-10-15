const HOURS = 24;
const MINUTES = 60;
const SECONDS = 60;
const MILLISECONDS = 1000;

/**
 * Calculates a new date based on a specified number of seconds in the future.
 *
 * @param seconds Number of seconds from now.
 * @returns A date object representing future time.
 */
export const secondsFromNow = (seconds: number) => new Date(Date.now() + seconds * MILLISECONDS);

/**
 * Calculates a new date based on a specified number of minutes in the future.
 *
 * @param seconds Number of minutes from now.
 * @returns A date object representing the future time.
 */
export const minutesFromNow = (mins: number) =>
  new Date(Date.now() + mins * SECONDS * MILLISECONDS);

/**
 * Calculates a new date based on a specified number of hours in the future.
 *
 * @param seconds Number of hours from now.
 * @returns A date object representing the future time.
 */
export const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * MINUTES * SECONDS * MILLISECONDS);

/**
 * Calculates a new date based on a specified number of days in the future.
 *
 * @param seconds Number of days from now.
 * @returns A date object representing the future time.
 */
export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * HOURS * MINUTES * SECONDS * MILLISECONDS);

/**
 * Calculates a new date based on a specified number of hours in the past.
 *
 * @param seconds Number of hours ago.
 * @returns A date object representing the past time.
 */
export const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * MINUTES * SECONDS * MILLISECONDS);

/**
 * Calculates a new date based on a specified number of days in the past.
 *
 * @param seconds Number of days ago.
 * @returns A date object representing the past time.
 */
export const daysAgo = (days: number) =>
  new Date(Date.now() - days * HOURS * MINUTES * SECONDS * MILLISECONDS);
