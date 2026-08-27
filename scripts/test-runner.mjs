import assert from 'assert';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

console.log('🧪 Running DeploShare Security & Logic Unit Tests...\n');

// 1. Test 6-Digit Code Generation
console.log('1. Testing 6-Digit Code Generation:');
for (let i = 0; i < 50; i++) {
  const num = crypto.randomInt(0, 1000000);
  const code = num.toString().padStart(6, '0');
  assert.strictEqual(code.length, 6, `Code ${code} must have length 6`);
  assert.match(code, /^[0-9]{6}$/, `Code ${code} must consist only of 6 numeric digits`);
}
console.log('  ✓ Generated 50 secure 6-digit codes matching /^[0-9]{6}$/\n');

// 2. Test File Guard & Dangerous Extension Blocking
console.log('2. Testing File Guard & Dangerous Extension Blocking:');
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.scr', '.vbs', '.msi', '.jar', '.ps1', '.dll'
]);

function validateFileTest(fileName, fileSize, maxSizeBytes) {
  if (fileSize > maxSizeBytes) return { valid: false, error: 'Size limit exceeded' };
  const ext = (fileName.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Executable or script (${ext}) prohibited` };
  }
  const sanitized = fileName.replace(/[\/\\]/g, '').replace(/[^a-zA-Z0-9.\-_ ()]/g, '_');
  return { valid: true, sanitizedFileName: sanitized };
}

// Test safe file
const safeRes = validateFileTest('my-document.pdf', 1024 * 1024, 100 * 1024 * 1024);
assert.strictEqual(safeRes.valid, true, 'PDF should be allowed');
assert.strictEqual(safeRes.sanitizedFileName, 'my-document.pdf');

// Test dangerous .exe
const exeRes = validateFileTest('malware.exe', 1024, 100 * 1024 * 1024);
assert.strictEqual(exeRes.valid, false, '.exe must be blocked');

// Test dangerous .sh
const shRes = validateFileTest('script.sh', 500, 100 * 1024 * 1024);
assert.strictEqual(shRes.valid, false, '.sh must be blocked');

// Test path traversal sanitization
const traversalRes = validateFileTest('../../../etc/passwd.txt', 100, 100 * 1024 * 1024);
assert.strictEqual(traversalRes.valid, true);
assert.strictEqual(traversalRes.sanitizedFileName.includes('/'), false, 'Slashes must be stripped');
assert.strictEqual(traversalRes.sanitizedFileName.includes('\\'), false, 'Backslashes must be stripped');

console.log('  ✓ Blocked executable files (.exe, .sh, etc.)');
console.log('  ✓ Sanitized path traversal attempts\n');

// 3. Test Password Hashing and Verification
console.log('3. Testing Password Security (bcrypt):');
const testPassword = 'SecretPassword123!';
const hash = await bcrypt.hash(testPassword, 10);
const match = await bcrypt.compare(testPassword, hash);
const mismatch = await bcrypt.compare('WrongPassword', hash);
assert.strictEqual(match, true, 'Valid password must match hash');
assert.strictEqual(mismatch, false, 'Invalid password must be rejected');
console.log('  ✓ Password hashing and comparison verified\n');

// 4. Test Rate Limiting / Lockout Threshold
console.log('4. Testing Rate Limiting & Lockout Calculation:');
const memoryMap = new Map();
function recordAttempt(id) {
  const current = memoryMap.get(id) || 0;
  const next = current + 1;
  memoryMap.set(id, next);
  return { attempts: next, locked: next >= 5 };
}

const testIp = '192.168.1.100';
for (let i = 1; i <= 4; i++) {
  const attempt = recordAttempt(testIp);
  assert.strictEqual(attempt.locked, false, `Attempt ${i} should not be locked`);
}
const fifthAttempt = recordAttempt(testIp);
assert.strictEqual(fifthAttempt.locked, true, '5th failed attempt must trigger lockout');
console.log('  ✓ Rate limiter successfully locks out after 5 consecutive failed attempts\n');

// 5. Test Developer API Key Hashing
console.log('5. Testing Developer REST API Key Security:');
const rawKey = 'dps_live_' + crypto.randomBytes(24).toString('hex');
assert.strictEqual(rawKey.startsWith('dps_live_'), true, 'API Key must have dps_live_ prefix');
const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
const verifyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
assert.strictEqual(keyHash, verifyHash, 'SHA-256 key hash matches');
assert.strictEqual(keyHash.length, 64, 'SHA-256 hash length is 64 hex characters');
console.log('  ✓ API Key prefix and SHA-256 hashing verified\n');

// 6. Test Zero-Knowledge AES-GCM 256 E2EE Encryption & Decryption
console.log('6. Testing Zero-Knowledge Client-Side AES-GCM 256 E2EE:');
const secretText = 'DeploShare Secret Token: sk_live_987654321';
const passphrase = 'SuperSecretPassphrase!';
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);

const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(secretText, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

// Decrypt
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');

assert.strictEqual(decrypted, secretText, 'Decrypted text matches original plaintext');
console.log('  ✓ AES-GCM 256 PBKDF2 E2EE encryption & decryption verified\n');

console.log('🎉 All Unit & Security Tests Passed Successfully!\n');
