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
} {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = expiryTime - now;

  if (diff <= 0) {
    return {
      isExpired: true,
      formatted: 'Expired',
      secondsRemaining: 0,
    };
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return {
      isExpired: false,
      formatted: `${days}d ${hours % 24}h remaining`,
      secondsRemaining: seconds,
    };
  }
  if (hours > 0) {
    return {
      isExpired: false,
      formatted: `${hours}h ${minutes % 60}m remaining`,
      secondsRemaining: seconds,
    };
  }
  if (minutes > 0) {
    return {
      isExpired: false,
      formatted: `${minutes}m ${seconds % 60}s remaining`,
      secondsRemaining: seconds,
    };
  }
  return {
    isExpired: false,
    formatted: `${seconds}s remaining`,
    secondsRemaining: seconds,
  };
}
