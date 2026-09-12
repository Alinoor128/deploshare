import path from 'path';
import crypto from 'crypto';

// Dangerous extensions that must NEVER be accepted for safety
const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.zsh',
  '.scr',
  '.vbs',
  '.vbe',
  '.msi',
  '.msp',
  '.com',
  '.pif',
  '.ps1',
  '.ps1xml',
  '.ps2',
  '.psc1',
  '.psc2',
  '.jar',
  '.jse',
  '.ws',
  '.wsf',
  '.wsc',
  '.wsh',
  '.reg',
  '.inf',
  '.dll',
  '.sys',
  '.drv',
  '.ocx',
  '.cpl',
  '.hta',
  '.apk',
  '.app',
  '.deb',
  '.rpm',
  '.iso',
  '.bin',
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFileName: string;
  storageFileName: string;
  mimeType: string;
  extension: string;
}

/**
 * Validate and sanitize uploaded file metadata.
 */
export function validateAndSanitizeFile(
  fileName: string,
  fileSize: number,
  mimeType: string,
  maxSizeBytes: number = 5120 * 1024 * 1024 // 5 GB default
): FileValidationResult {
  if (!fileName || typeof fileName !== 'string') {
    return {
      valid: false,
      error: 'Invalid file name',
      sanitizedFileName: 'unknown_file',
      storageFileName: `${crypto.randomUUID()}`,
      mimeType: 'application/octet-stream',
      extension: '',
    };
  }

  // Check size limit
  if (fileSize <= 0) {
    return {
      valid: false,
      error: 'File is empty (0 bytes)',
      sanitizedFileName: fileName,
      storageFileName: `${crypto.randomUUID()}`,
      mimeType,
      extension: '',
    };
  }

  if (fileSize > maxSizeBytes) {
    const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File exceeds maximum allowed size of ${maxMB} MB.`,
      sanitizedFileName: fileName,
      storageFileName: `${crypto.randomUUID()}`,
      mimeType,
      extension: '',
    };
  }

  // Strip path traversal sequences like ../ or ..\
  const baseName = path.basename(fileName).replace(/[\/\\]/g, '');
  const ext = path.extname(baseName).toLowerCase();

  // Check dangerous extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Executable or script file type (${ext}) is prohibited for security reasons.`,
      sanitizedFileName: baseName,
      storageFileName: `${crypto.randomUUID()}`,
      mimeType,
      extension: ext,
    };
  }

  // Sanitize file name (allow alphanumeric, dashes, underscores, dots, spaces)
  const sanitizedFileName = baseName
    .replace(/[^a-zA-Z0-9.\-_ ()]/g, '_')
    .slice(0, 150);

  // Generate safe non-guessable storage filename
  const randomSuffix = crypto.randomBytes(16).toString('hex');
  const storageFileName = `${Date.now()}_${randomSuffix}${ext}`;

  return {
    valid: true,
    sanitizedFileName: sanitizedFileName || 'uploaded_file',
    storageFileName,
    mimeType: mimeType || 'application/octet-stream',
    extension: ext,
  };
}

/**
 * Determine if a file type is safe for inline browser preview.
 */
export function isSafePreviewableMime(mimeType: string | null): boolean {
  if (!mimeType) return false;
  const safePrefixes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
  ];

  return safePrefixes.some((prefix) => mimeType.toLowerCase().startsWith(prefix));
}
