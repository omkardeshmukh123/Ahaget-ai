import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LEN = 12;
const PREFIX = 'enc:';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function isEncryptionEnabled(): boolean {
  const k = process.env.ENCRYPTION_KEY;
  return !!k && k.length === 64;
}

/**
 * AES-256-GCM encrypt. Returns `enc:<iv>:<tag>:<ciphertext>` (all hex).
 * Throws if ENCRYPTION_KEY is not configured.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value produced by `encrypt()`.
 * If the value does not start with `enc:` it is returned as-is — this allows
 * plaintext rows written before encryption was enabled to keep working.
 */
export function decrypt(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const rest = value.slice(PREFIX.length);
  const parts = rest.split(':');
  if (parts.length !== 3) return value; // malformed — return as-is, don't throw
  const [ivHex, tagHex, dataHex] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Encrypt if encryption is enabled; otherwise return the plaintext unchanged.
 * Use this in write paths so the server works gracefully without ENCRYPTION_KEY.
 */
export function encryptIfEnabled(plaintext: string): string {
  return isEncryptionEnabled() ? encrypt(plaintext) : plaintext;
}
