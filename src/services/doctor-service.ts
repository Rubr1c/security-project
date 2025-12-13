import { db, sqlite } from '@/lib/db/client';
import { users, appointments, medications } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { encrypt, hashEmail } from '@/lib/security/crypto';
import { decryptUserRecords } from '@/lib/security/fields';
import bcrypt from 'bcrypt';
import { ServiceError } from './errors';

export const doctorService = {
  async createDoctor(data: { email: string; name: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Check if email exists?
    // db.insert doesn't throw usually with Drizzle unless constraint violation.
    // Ideally we check first or handle error.
    // Existing controller didn't check explicitly but schema might have unique constraint?
    // User schema usually has unique emailHash.
    // I'll add a check or let it fail? Existing controller just ran `run()`.
    // I will let it run, but generally checking is better.
    // For now mirroring existing logic but cleaner.

    // Wait, Drizzle `run()` might throw if unique constraint fails.

    const insertResult = db
      .insert(users)
      .values({
        email: encrypt(data.email),
        emailHash: hashEmail(data.email),
        name: encrypt(data.name),
        passwordHash: hashedPassword,
        role: 'doctor',
      })
      .run();

    return {
      id: insertResult.lastInsertRowid,
      email: data.email,
    };
  },

  async getAllDoctors() {
    const doctors = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'doctor'))
      .all();

    return decryptUserRecords(doctors, [
      'id',
      'email',
      'name',
      'role',
      'createdAt',
    ]);
  },

  async deleteDoctor(doctorId: number, force: boolean) {
    const doctor = db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, doctorId), eq(users.role, 'doctor')))
      .all();

    if (doctor.length === 0) {
      throw new ServiceError('Doctor not found', 404);
    }

    const appts = db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .all();

    if (appts.length > 0 && !force) {
      throw new ServiceError(
        'This doctor has appointments. Delete anyway to remove the doctor and all associated appointments/medications.',
        409
      );
    }

    let deletionSuccess = false;

    sqlite.transaction(() => {
      // Unassign nurses
      db.update(users)
        .set({ doctorId: null, updatedAt: new Date().toISOString() })
        .where(eq(users.doctorId, doctorId))
        .run();

      if (appts.length > 0) {
        const apptIds = appts.map((a) => a.id);

        db.delete(medications)
          .where(inArray(medications.appointmentId, apptIds))
          .run();

        db.delete(appointments).where(inArray(appointments.id, apptIds)).run();
      }

      const deleteResult = db
        .delete(users)
        .where(and(eq(users.id, doctorId), eq(users.role, 'doctor')))
        .run();

      if (deleteResult.changes === 0) {
        // Should catch this outside or handle
        // existing code threw Error inside transaction
        // Transaction rollbacks on error?
        // Drizzle/SQLite transaction wrapper usually handles rollback on exception.
        throw new ServiceError('Doctor not found or already deleted', 404);
      }
      deletionSuccess = true;
    })();

    // If transaction throws, it will bubble up.
    return { success: deletionSuccess, doctorId };
  },
};
