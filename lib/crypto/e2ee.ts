/**
 * DeploShare Zero-Knowledge End-to-End Encryption (E2EE)
 * Uses native Web Crypto API (SubtleCrypto) with AES-GCM 256-bit encryption.
 * Encrypts data in the sender's browser before upload; decrypts in the recipient's browser.
 */

const MAGIC_HEADER = new TextEncoder().encode('DPS_E2EE_V1'); // 11 bytes
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

/**
 * Derive a 256-bit AES-GCM CryptoKey from a passphrase using PBKDF2-SHA256.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt an ArrayBuffer with AES-GCM 256-bit using a client-side passphrase.
 * Header format: [DPS_E2EE_V1 (11 bytes)] [Salt (16 bytes)] [IV (12 bytes)] [Ciphertext]
 */
export async function encryptBuffer(
  plainBuffer: ArrayBuffer,
  passphrase: string
): Promise<ArrayBuffer> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    plainBuffer
  );

  // Pack header + salt + iv + ciphertext
  const totalLength = MAGIC_HEADER.length + SALT_LENGTH + IV_LENGTH + ciphertext.byteLength;
  const result = new Uint8Array(totalLength);

  let offset = 0;
  result.set(MAGIC_HEADER, offset);
  offset += MAGIC_HEADER.length;

  result.set(salt, offset);
  offset += SALT_LENGTH;

  result.set(iv, offset);
  offset += IV_LENGTH;

  result.set(new Uint8Array(ciphertext), offset);

  return result.buffer;
}

/**
 * Decrypt an ArrayBuffer with AES-GCM 256-bit using the passphrase.
 */
export async function decryptBuffer(
  encryptedBuffer: ArrayBuffer,
  passphrase: string
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encryptedBuffer);

  // Check magic header
  if (data.length < MAGIC_HEADER.length + SALT_LENGTH + IV_LENGTH) {
    throw new Error('Encrypted payload too short.');
  }

  for (let i = 0; i < MAGIC_HEADER.length; i++) {
    if (data[i] !== MAGIC_HEADER[i]) {
      throw new Error('Invalid encryption format header.');
    }
  }

  let offset = MAGIC_HEADER.length;
  const salt = data.slice(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = data.slice(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;

  const ciphertext = data.slice(offset);

  const key = await deriveKey(passphrase, salt);

  try {
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );
  } catch {
    throw new Error('Decryption failed: Incorrect key or corrupted payload.');
  }
}

/**
 * Encrypt a text string into an E2EE Base64 payload.
 */
export async function encryptText(plainText: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const plainBuffer = enc.encode(plainText).buffer;
  const encBuffer = await encryptBuffer(plainBuffer, passphrase);

  // Convert buffer to Base64
  let binary = '';
  const bytes = new Uint8Array(encBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decrypt a Base64 E2EE payload back into a plaintext string.
 */
export async function decryptText(base64Payload: string, passphrase: string): Promise<string> {
  const binary = atob(base64Payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const decBuffer = await decryptBuffer(bytes.buffer, passphrase);
  const dec = new TextDecoder();
  return dec.decode(decBuffer);
}
