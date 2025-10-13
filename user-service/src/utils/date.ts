const HOURS = 24;
const MINUTES = 60;
const SECONDS = 60;
const MILLISECONDS = 1000;

export const secondsFromNow = (seconds: number) => new Date(Date.now() + seconds * MILLISECONDS);

export const minutesFromNow = (mins: number) =>
  new Date(Date.now() + mins * SECONDS * MILLISECONDS);

export const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * MINUTES * SECONDS * MILLISECONDS);

export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * HOURS * MINUTES * SECONDS * MILLISECONDS);

export const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * MINUTES * SECONDS * MILLISECONDS);

export const daysAgo = (days: number) =>
  new Date(Date.now() - days * HOURS * MINUTES * SECONDS * MILLISECONDS);
