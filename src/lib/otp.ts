import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export const OTP_CODE_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds

export function generateOtpCode(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(OTP_CODE_LENGTH, '0');
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiresAtISO(now = Date.now()): string {
  return new Date(now + OTP_TTL_MS).toISOString();
}

export function isExpired(expiresAtISO: string, now = Date.now()): boolean {
  const expiresAt = Date.parse(expiresAtISO);
  if (Number.isNaN(expiresAt)) return true;
  return now > expiresAt;
}


