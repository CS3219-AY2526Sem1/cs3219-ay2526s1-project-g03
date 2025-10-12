const HOURS = 24;
const MINUTES = 60;
const SECONDS = 60;
const MILLISECONDS = 1000;

export const oneDay = () => new Date(Date.now() + 1 * HOURS * MINUTES * SECONDS * MILLISECONDS);
