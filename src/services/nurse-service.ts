import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { encrypt, hashEmail } from '@/lib/security/crypto';
import { decryptUserRecords } from '@/lib/security/fields';
import bcrypt from 'bcrypt';
import { ServiceError } from './errors';

export const nurseService = {
  async createNurse(data: { email: string; name: string; password: string }, creatorId: number) {
    const emailHashValue = hashEmail(data.email);

    const existingUser = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailHash, emailHashValue))
      .all();

    if (existingUser.length > 0) {
      throw new ServiceError('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const insertResult = db.insert(users)
      .values({
        email: encrypt(data.email),
        emailHash: emailHashValue,
        name: encrypt(data.name),
        passwordHash: hashedPassword,
        role: 'nurse',
      })
      .run();
    
    return {
        id: insertResult.lastInsertRowid,
        email: data.email
    };
  },

  async getAllNurses() {
    const nurses = db
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
      .where(eq(users.role, 'nurse'))
      .all();

    return decryptUserRecords(nurses, [
      'id',
      'email',
      'name',
      'role',
      'doctorId',
      'createdAt',
      'updatedAt',
    ]);
  },

  async deleteNurse(nurseId: number, adminId: number) {
    const nurse = db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
      .all();

    if (nurse.length === 0) {
      throw new ServiceError('Nurse not found', 404);
    }

    const deleteResult = db
      .delete(users)
      .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
      .run();

    if (deleteResult.changes === 0) {
        // Should have been caught by select above, but for safety
        throw new ServiceError('Nurse not found or already deleted', 404);
    }
  },

  async assignNurse(nurseId: number, doctorId: number) {
    const nurse = db
      .select({ id: users.id, role: users.role, doctorId: users.doctorId })
      .from(users)
      .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
      .all();

    if (nurse.length === 0) {
      throw new ServiceError('Nurse not found', 404);
    }

    if (nurse[0].doctorId !== null && nurse[0].doctorId !== doctorId) {
       throw new ServiceError('Nurse is already assigned to another doctor', 400);
    }

    const updateResult = await db
      .update(users)
      .set({ doctorId: doctorId, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(users.id, nurseId),
          eq(users.role, 'nurse'),
          or(isNull(users.doctorId), eq(users.doctorId, doctorId))
        )
      );

    if (updateResult.changes === 0) {
      throw new ServiceError('Nurse assignment failed - concurrent modification', 409);
    }

    return { nurseId, doctorId };
  },

  async unassignNurse(nurseId: number, doctorId: number) {
    const nurse = db
      .select({ id: users.id, role: users.role, doctorId: users.doctorId })
      .from(users)
      .where(and(eq(users.id, nurseId), eq(users.role, 'nurse')))
      .all();

    if (nurse.length === 0) {
      throw new ServiceError('Nurse not found', 404);
    }

    if (nurse[0].doctorId === null) {
      return { message: 'Nurse is already unassigned' };
    }

    if (nurse[0].doctorId !== doctorId) {
      throw new ServiceError('Unauthorized: Cannot unassign nurse from another doctor', 403);
    }

    const updateResult = await db
      .update(users)
      .set({ doctorId: null, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(users.id, nurseId),
          eq(users.role, 'nurse'),
          eq(users.doctorId, doctorId)
        )
      );

    if (updateResult.changes === 0) {
      throw new ServiceError('Nurse unassignment failed', 409);
    }
  }
};
