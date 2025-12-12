import crypto from 'crypto';
import { env } from '../env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
export const BCRYPT_COST = 10;

function getEncryptionKey(): Buffer {
  return Buffer.from(env.ENCRYPTION_KEY, 'hex');
}

export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return plaintext;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    return encryptedText;
  }

  const key = getEncryptionKey();
  const [ivBase64, authTagBase64, ciphertextBase64] = parts;

  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function isEncrypted(text: string): boolean {
  if (!text) {
    return false;
  }

  const parts = text.split(':');
  if (parts.length !== 3) {
    return false;
  }

  try {
    const [iv, authTag] = parts;
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    return (
      ivBuffer.length === IV_LENGTH && authTagBuffer.length === AUTH_TAG_LENGTH
    );
  } catch {
    return false;
  }
}

export function hashEmail(email: string): string {
  if (!email) {
    return email;
  }
  const normalized = email.toLowerCase().trim();
  const peppered = `${normalized}${env.HASH_PEPPER}`;
  return crypto.createHash('sha256').update(peppered).digest('hex');
}
