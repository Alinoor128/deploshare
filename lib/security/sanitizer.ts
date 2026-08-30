/**
 * Text & Markup Security Sanitizer
 * Prevents XSS, script injection, and unsafe HTML execution.
 */

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateTimeRemaining(expiresAt: string): {
  isExpired: boolean;
  formatted: string;
  secondsRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expiryTime - now;

  if (diff <= 0) {
    return {
      isExpired: true,
      formatted: 'Expired',
      secondsRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSecs = Math.floor(diff / 1000);
  const totalMins = Math.floor(totalSecs / 60);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMins % 60;
  const seconds = totalSecs % 60;

  if (days > 0) {
    return {
      isExpired: false,
      formatted: `${days}d ${hours}h remaining`,
      secondsRemaining: totalSecs,
      days,
      hours,
      minutes,
      seconds,
    };
  }
  if (totalHours > 0) {
    return {
      isExpired: false,
      formatted: `${hours}h ${minutes}m remaining`,
      secondsRemaining: totalSecs,
      days: 0,
      hours,
      minutes,
      seconds,
    };
  }
  if (minutes > 0) {
    return {
      isExpired: false,
      formatted: `${minutes}m ${seconds}s remaining`,
      secondsRemaining: totalSecs,
      days: 0,
      hours: 0,
      minutes,
      seconds,
    };
  }
  return {
    isExpired: false,
    formatted: `${seconds}s remaining`,
    secondsRemaining: totalSecs,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds,
  };
}
