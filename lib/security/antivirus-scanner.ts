/**
 * DeploShare Deep Anti-Malware, Magic Byte & Content Security Scanner
 * Inspects binary payloads, prevents MIME-type spoofing, blocks dangerous scripts,
 * and neutralizes SQL-injection and XSS vectors.
 */

export interface ScanResult {
  safe: boolean;
  threatType?: string;
  reason?: string;
}

/**
 * Common Malicious Magic Byte Signatures
 */
const MALICIOUS_MAGIC_SIGNATURES = [
  {
    name: 'Windows Executable (PE / DOS)',
    bytes: [0x4d, 0x5a], // 'MZ'
  },
  {
    name: 'Linux ELF Binary',
    bytes: [0x7f, 0x45, 0x4c, 0x46], // '\x7fELF'
  },
  {
    name: 'macOS Mach-O Binary (32-bit)',
    bytes: [0xfe, 0xed, 0xfa, 0xce],
  },
  {
    name: 'macOS Mach-O Binary (64-bit)',
    bytes: [0xfe, 0xed, 0xfa, 0xcf],
  },
  {
    name: 'macOS Universal Binary',
    bytes: [0xca, 0xfe, 0xba, 0xbe],
  },
];

/**
 * Scan binary buffer header for disguised executables or malware.
 */
export function scanBinaryBuffer(buffer: Buffer): ScanResult {
  if (!buffer || buffer.length === 0) {
    return { safe: true };
  }

  // Check magic byte signatures
  for (const sig of MALICIOUS_MAGIC_SIGNATURES) {
    if (buffer.length >= sig.bytes.length) {
      let match = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (buffer[i] !== sig.bytes[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        return {
          safe: false,
          threatType: 'DISGUISED_EXECUTABLE',
          reason: `Disguised executable binary detected (${sig.name}). Upload blocked for security.`,
        };
      }
    }
  }

  // Check for shell shebang in non-text files
  if (buffer.length >= 2 && buffer[0] === 0x23 && buffer[1] === 0x21) {
    const headStr = buffer.slice(0, 64).toString('utf-8').toLowerCase();
    if (
      headStr.includes('/bin/sh') ||
      headStr.includes('/bin/bash') ||
      headStr.includes('/bin/zsh') ||
      headStr.includes('/bin/dash') ||
      headStr.includes('cmd.exe') ||
      headStr.includes('powershell')
    ) {
      return {
        safe: false,
        threatType: 'EXECUTABLE_SCRIPT',
        reason: 'Executable shell script or batch payload detected. Upload blocked.',
      };
    }
  }

  return { safe: true };
}

/**
 * Scan text content for malicious XSS, exploit vectors, and SQL Injection attacks.
 */
export function scanTextContent(text: string): ScanResult {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  const lower = text.toLowerCase();

  // 1. High-risk browser exploitation patterns
  const maliciousXssPatterns = [
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi,
    /<object\b[^>]*>([\s\S]*?)<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<applet\b[^>]*>/gi,
    /javascript:\s*void\s*\(|javascript:\s*alert\(|javascript:\s*eval\(/gi,
    /data:text\/html;base64/gi,
    /<[a-z]+[^>]+(onerror|onload|onmouseover|onclick|onfocus)\s*=/gi,
  ];

  for (const pattern of maliciousXssPatterns) {
    if (pattern.test(text)) {
      return {
        safe: false,
        threatType: 'MALICIOUS_SCRIPT_XSS',
        reason: 'Malicious HTML/JavaScript script payload detected. Upload rejected.',
      };
    }
  }

  // 2. Dangerous SQL Injection vectors designed to corrupt or exploit databases
  if (
    (lower.includes('union select') || lower.includes('drop table') || lower.includes('information_schema')) &&
    (lower.includes("'") || lower.includes('--') || lower.includes('/*'))
  ) {
    return {
      safe: false,
      threatType: 'SQL_INJECTION_PROBE',
      reason: 'Malicious SQL injection payload detected. Request terminated.',
    };
  }

  return { safe: true };
}
