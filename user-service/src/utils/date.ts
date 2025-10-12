const HOURS = 24;
const MINUTES = 60;
const SECONDS = 60;
const MILLISECONDS = 1000;

export const minutesFromNow = (mins: number) =>
  new Date(Date.now() + mins * SECONDS * MILLISECONDS);

export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * HOURS * MINUTES * SECONDS * MILLISECONDS);
