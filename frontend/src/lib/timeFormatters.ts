/**
 * Converts milliseconds to a human-readable string (e.g., '15 min' or '1.2 hr').
 */
export const formatDuration = (ms: number | null | undefined): string => {
  if (!ms || ms < 0) return '0 min';
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = (minutes / 60).toFixed(1);
  return `${hours} hr`;
};

/**
 * Converts milliseconds to minutes (for display in attempt cards).
 */
export const formatDurationMinutes = (ms: number | null | undefined): string => {
  if (!ms || ms < 0) return '0 min';
  const minutes = Math.round(ms / 60000);
  return `${minutes} min`;
};

/**
 * Converts a timestamp string to a relative 'time ago' format.
 * (A simple version for now, can be replaced with a library like `date-fns` later)
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
};
