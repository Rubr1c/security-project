import { db } from '@/lib/db/client';
import { users, appointments, medications } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { decryptUserRecords, decryptUserFields, decryptAppointmentRecords, decryptMedicationRecords } from '@/lib/security/fields';
import { logger } from '@/lib/logger';
import { ServiceError } from './errors';

export const patientService = {
  async getPatientsForDoctor(doctorId: number) {
    const patients = db
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
      .where(and(eq(users.role, 'patient'), eq(users.doctorId, doctorId)))
      .all();

    return decryptUserRecords(patients, ['id', 'email', 'name', 'role', 'doctorId', 'createdAt', 'updatedAt']);
  },

  async getPatientDetails(requesterId: number, patientId: number) {
    // Check if patient exists
    const patient = db
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
      .where(and(eq(users.id, patientId), eq(users.role, 'patient')))
      .all();

    if (patient.length === 0) {
      throw new ServiceError('Patient not found', 404);
    }

    // Access control: Doctor must be assigned OR have history
    const patientAppointments = db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.doctorId, requesterId)
        )
      )
      .all();

    const isAssigned = patient[0].doctorId === requesterId;
    const hasHistory = patientAppointments.length > 0;

    if (!isAssigned && !hasHistory) {
      // 404 to avoid leaking existence? Or 403? Existing code returned 404 "Patient not found".
      throw new ServiceError('Patient not found', 404);
    }

    let patientMedications: {
      id: number;
      appointmentId: number;
      name: string;
      dosage: string;
      instructions: string;
    }[] = [];

    if (patientAppointments.length > 0) {
      const appointmentIds = patientAppointments.map((a) => a.id);
      patientMedications = db
        .select({
          id: medications.id,
          appointmentId: medications.appointmentId,
          name: medications.name,
          dosage: medications.dosage,
          instructions: medications.instructions,
        })
        .from(medications)
        .where(inArray(medications.appointmentId, appointmentIds))
        .all();
    }

    // Log PHI Access
    logger
      .getAuditLogger()
      ?.logPhiAccess(requesterId, patientId, 'Patient Record', patientId);

    return {
      ...decryptUserFields(patient[0]),
      appointments: decryptAppointmentRecords(patientAppointments),
      medications: decryptMedicationRecords(patientMedications),
    };
  }
};
