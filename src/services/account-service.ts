import { db } from '@/lib/db/client';
import { users, appointments, medications } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { decryptUserFields, decryptAppointmentRecords, decryptMedicationRecords } from '@/lib/security/fields';
import { encrypt, hashEmail } from '@/lib/security/crypto';
import { logger } from '@/lib/logger';
import { ServiceError } from './errors';
import { randomUUID } from 'crypto';

export const accountService = {
  async getProfile(userId: number) {
    const user = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        doctorId: users.doctorId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .all();

    if (user.length === 0) {
      throw new ServiceError('User not found', 404);
    }

    return decryptUserFields(user[0]);
  },

  async deleteAccount(userId: number) {
     // Strict Compliance Logging
    logger.getAuditLogger()?.logAccountDeletion(userId);

    // Anonymization (Soft Delete)
    const timestamp = Date.now();
    const randomSuffix = randomUUID();

    try {
      const deletedEmailRaw = `deleted-${timestamp}-${randomSuffix}@healthcure.deleted`;
      const encryptedEmail = encrypt(deletedEmailRaw);
      const emailHash = hashEmail(deletedEmailRaw);

      db.update(users)
        .set({
          name: `Deleted User ${userId}`,
          email: encryptedEmail,
          emailHash: emailHash,
          passwordHash: 'DELETED_ACCOUNT_NO_LOGIN',
          role: 'patient',
          otpHash: null,
          pendingPasswordHash: null,
          pendingPasswordExpiresAt: null,
          otpExpiresAt: null,
          otpLastSentAt: null,
          otpAttempts: 0,
          emailVerifiedAt: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId))
        .run();
        
      return true;
    } catch (err: any) {
       // Ideally we wrap error with more context, but existing controller caught generic 'any'
       // We can throw ServiceError
       throw new ServiceError('Failed to delete account', 500); 
    }
  },



  async exportUserData(userId: number) {
    const user = db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
      throw new ServiceError('User not found', 404);
    }

    const userAppointments = db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, userId))
      .all();

    let userMedications: (typeof medications.$inferSelect)[] = [];

    if (userAppointments.length > 0) {
      const appointmentIds = userAppointments.map((a) => a.id);
      userMedications = db
        .select()
        .from(medications)
        .where(inArray(medications.appointmentId, appointmentIds))
        .all();
    }

    // Strict Compliance Logging
    logger.getAuditLogger()?.logDataExport(userId, userId);

    return {
      user: decryptUserFields(user),
      appointments: decryptAppointmentRecords(userAppointments),
      medications: decryptMedicationRecords(userMedications),
      metadata: {
        exportedAt: new Date().toISOString(),
        compliance: 'GDPR Article 20 / HIPAA Right of Access',
      },
    };
  }
};
