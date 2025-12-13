import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, gt, lt, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import {
  hashEmail,
  encrypt,
  decrypt,
  BCRYPT_COST,
} from '@/lib/security/crypto';
import { decryptUserFields } from '@/lib/security/fields';
import {
  generateOtpCode,
  hashOtpCode,
  otpExpiresAtISO,
  isExpired,
  verifyOtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
} from '@/lib/otp';
import { sendOtpEmail } from '@/lib/email/send-otp';
import { jwt } from '@/lib/jwt';
import { randomBytes, createHash } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email/mailer';

import { ServiceError } from './errors';
export { ServiceError };

// Dummy hash for timing attack mitigation
const DUMMY_HASH = bcrypt.hashSync(
  'dummy-password-for-timing-mitigation',
  BCRYPT_COST
);

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authService = {
  async login(email: string, password: string) {
    const emailHashValue = hashEmail(email);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        loginAttempts: users.loginAttempts,
        loginLockedUntil: users.loginLockedUntil,
      })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new ServiceError('Invalid Credentials', 401);
    }

    if (user.loginLockedUntil) {
      const lockExpiry = Date.parse(user.loginLockedUntil);
      if (!Number.isNaN(lockExpiry) && Date.now() < lockExpiry) {
        const remainingMs = lockExpiry - Date.now();
        const remainingMins = Math.ceil(remainingMs / 60000);
        throw new ServiceError(
          `Account locked. Try again in ${remainingMins} minute(s).`,
          429
        );
      }
    }

    const passwordMatched = await bcrypt.compare(password, user.passwordHash);
    const nowIso = new Date().toISOString();

    if (!passwordMatched) {
      const newAttempts = (user.loginAttempts ?? 0) + 1;

      if (newAttempts >= LOGIN_MAX_ATTEMPTS) {
        // Lock the account
        const lockUntil = new Date(
          Date.now() + LOGIN_LOCKOUT_DURATION_MS
        ).toISOString();
        await db
          .update(users)
          .set({
            loginAttempts: newAttempts,
            loginLockedUntil: lockUntil,
            updatedAt: nowIso,
          })
          .where(eq(users.id, user.id));
        throw new ServiceError(
          'Too many failed attempts. Account locked for 15 minutes.',
          429
        );
      } else {
        // Increment attempts
        await db
          .update(users)
          .set({
            loginAttempts: newAttempts,
            updatedAt: nowIso,
          })
          .where(eq(users.id, user.id));
      }

      throw new ServiceError('Invalid Credentials', 401);
    }

    const code = generateOtpCode();
    const otpHash = await hashOtpCode(code);
    const expiresAt = otpExpiresAtISO();

    await db
      .update(users)
      .set({
        otpHash,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLastSentAt: nowIso,
        loginAttempts: 0,
        loginLockedUntil: null,
        updatedAt: nowIso,
      })
      .where(eq(users.id, user.id));

    const decryptedEmail = decrypt(user.email);

    await sendOtpEmail({
      to: decryptedEmail,
      code,
      expiresMinutes: 10,
    });

    return {
      otpRequired: true,
      email: decryptedEmail,
      userId: user.id,
    };
  },

  async register(data: { email: string; name: string; password: string }) {
    const emailHashValue = hashEmail(data.email);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    if (existing.length > 0) {
      throw new ServiceError('Email already exists', 400);
    }

    const nowIso = new Date().toISOString();
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_COST);

    db.insert(users)
      .values({
        email: encrypt(data.email),
        emailHash: emailHashValue,
        name: encrypt(data.name),
        passwordHash,
        role: 'patient',
        emailVerifiedAt: null,
        otpHash: null,
        otpExpiresAt: null,
        otpLastSentAt: null,
        otpAttempts: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .run();

    const [created] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    const decryptedCreated = created ? decryptUserFields(created) : null;

    if (!decryptedCreated) {
      throw new ServiceError('Failed to create user', 500);
    }

    const code = generateOtpCode();
    const otpHash = await hashOtpCode(code);
    const expiresAt = otpExpiresAtISO();

    await db
      .update(users)
      .set({
        otpHash,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLastSentAt: nowIso,
        updatedAt: nowIso,
      })
      .where(eq(users.id, created.id));

    await sendOtpEmail({
      to: decryptedCreated.email,
      code,
      expiresMinutes: 10,
    });

    return {
      otpRequired: true,
      email: data.email,
    };
  },

  async verifyOtp(email: string, code: string) {
    const emailHashValue = hashEmail(email);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        otpHash: users.otpHash,
        otpExpiresAt: users.otpExpiresAt,
        otpAttempts: users.otpAttempts,
      })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    if (!user) {
      throw new ServiceError('Invalid code', 400);
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      throw new ServiceError('No active code. Request a new code.', 400);
    }

    if (isExpired(user.otpExpiresAt)) {
      throw new ServiceError('Code expired. Request a new code.', 400);
    }

    const nowIso = new Date().toISOString();

    const incrementResult = db
      .update(users)
      .set({
        otpAttempts: sql`${users.otpAttempts} + 1`,
        updatedAt: nowIso,
      })
      .where(
        and(eq(users.id, user.id), lt(users.otpAttempts, OTP_MAX_ATTEMPTS))
      )
      .run();

    if (incrementResult.changes === 0) {
      throw new ServiceError('Too many attempts. Request a new code.', 429);
    }

    const ok = await verifyOtpCode(code, user.otpHash);

    if (!ok) {
      throw new ServiceError('Invalid code', 400);
    }

    await db
      .update(users)
      .set({
        otpHash: null,
        otpExpiresAt: null,
        otpLastSentAt: null,
        otpAttempts: 0,
        emailVerifiedAt: user.emailVerifiedAt ?? nowIso,
        updatedAt: nowIso,
      })
      .where(eq(users.id, user.id));

    const token = await jwt.sign({ userId: user.id, role: user.role });
    return { token, userId: user.id, role: user.role };
  },

  async resendOtp(email: string) {
    const emailHashValue = hashEmail(email);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        otpLastSentAt: users.otpLastSentAt,
      })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    if (!user) {
      // Return successfully to avoid email enumeration
      return;
    }

    const now = Date.now();
    if (user.otpLastSentAt) {
      const last = Date.parse(user.otpLastSentAt);
      if (!Number.isNaN(last) && now - last < OTP_RESEND_COOLDOWN_MS) {
        throw new ServiceError(
          'Please wait before requesting a new code.',
          429
        );
      }
    }

    const code = generateOtpCode();
    const otpHash = await hashOtpCode(code);
    const expiresAt = otpExpiresAtISO(now);
    const nowIso = new Date(now).toISOString();

    await db
      .update(users)
      .set({
        otpHash,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLastSentAt: nowIso,
        updatedAt: nowIso,
      })
      .where(eq(users.id, user.id));

    await sendOtpEmail({ to: decrypt(user.email), code, expiresMinutes: 10 });
    return { userId: user.id, email: email };
  },

  async forgotPassword(email: string) {
    const emailHashValue = hashEmail(email);

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailHash, emailHashValue));

    if (!user) {
      return; // Silent success
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour

    await db
      .update(users)
      .set({
        passwordResetToken: tokenHash,
        passwordResetTokenExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(email, token);
    return { userId: user.id };
  },

  async resetPassword(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, tokenHash),
          gt(users.passwordResetTokenExpiresAt, new Date().toISOString())
        )
      );

    if (!user) {
      throw new ServiceError('Invalid or expired token', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    return { userId: user.id };
  },

  async changePassword(
    userId: number,
    data:
      | { type: 'verify'; code: string }
      | { type: 'request'; oldPassword?: string; newPassword?: string }
  ) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        otpHash: users.otpHash,
        otpExpiresAt: users.otpExpiresAt,
        otpAttempts: users.otpAttempts,
        pendingPasswordHash: users.pendingPasswordHash,
        pendingPasswordExpiresAt: users.pendingPasswordExpiresAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    if (data.type === 'verify') {
      if (!user.pendingPasswordHash || !user.pendingPasswordExpiresAt) {
        throw new ServiceError('No pending password change request.', 400);
      }

      if (isExpired(user.pendingPasswordExpiresAt)) {
        await db
          .update(users)
          .set({
            pendingPasswordHash: null,
            pendingPasswordExpiresAt: null,
            otpHash: null,
            otpExpiresAt: null,
            otpLastSentAt: null,
            otpAttempts: 0,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, user.id));
        throw new ServiceError(
          'Password change request expired. Start again.',
          400
        );
      }

      if (!user.otpHash || !user.otpExpiresAt) {
        throw new ServiceError('No active code. Request a new code.', 400);
      }

      if (isExpired(user.otpExpiresAt)) {
        throw new ServiceError('Code expired. Request a new code.', 400);
      }

      const nowIso = new Date().toISOString();

      const incrementResult = db
        .update(users)
        .set({
          otpAttempts: sql`${users.otpAttempts} + 1`,
          updatedAt: nowIso,
        })
        .where(
          and(eq(users.id, user.id), lt(users.otpAttempts, OTP_MAX_ATTEMPTS))
        )
        .run();

      if (incrementResult.changes === 0) {
        throw new ServiceError('Too many attempts. Request a new code.', 429);
      }

      const ok = await verifyOtpCode(data.code, user.otpHash);

      if (!ok) {
        throw new ServiceError('Invalid code', 400);
      }

      await db
        .update(users)
        .set({
          passwordHash: user.pendingPasswordHash,
          pendingPasswordHash: null,
          pendingPasswordExpiresAt: null,
          otpHash: null,
          otpExpiresAt: null,
          otpLastSentAt: null,
          otpAttempts: 0,
          updatedAt: nowIso,
        })
        .where(eq(users.id, user.id));

      return { success: true, userId: user.id };
    } else {
      if (!data.oldPassword || !data.newPassword) {
        throw new ServiceError('Missing passwords', 400);
      }

      if (data.oldPassword === data.newPassword) {
        throw new ServiceError(
          'New password must be different from old password',
          400
        );
      }

      const oldOk = await bcrypt.compare(data.oldPassword, user.passwordHash);
      if (!oldOk) {
        throw new ServiceError('Invalid old password', 401);
      }

      const pendingPasswordHash = await bcrypt.hash(data.newPassword, 10);
      const code = generateOtpCode();
      const otpHash = await hashOtpCode(code);
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await db
        .update(users)
        .set({
          pendingPasswordHash,
          pendingPasswordExpiresAt: expiresAt,
          otpHash,
          otpExpiresAt: expiresAt,
          otpAttempts: 0,
          otpLastSentAt: nowIso,
          updatedAt: nowIso,
        })
        .where(eq(users.id, user.id));

      const decryptedEmail = decrypt(user.email);
      await sendOtpEmail({ to: decryptedEmail, code, expiresMinutes: 10 });
      return { otpRequired: true, email: decryptedEmail, userId: user.id };
    }
  },
};
