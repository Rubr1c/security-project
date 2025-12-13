import { db } from '@/lib/db/client';
import { users, appointments, medications } from '@/lib/db/schema';
import { eq, and, inArray, or, sql } from 'drizzle-orm';
import {
  decryptUserRecords,
  decryptUserFields,
  decryptAppointmentRecords,
  decryptMedicationRecords,
} from '@/lib/security/fields';
import { logger } from '@/lib/logger';
import { ServiceError } from './errors';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const patientService = {
  async getPatientsForDoctor(
    doctorId: number,
    page = 1,
    limit = DEFAULT_LIMIT
  ) {
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const historyPatients = db
      .select({ patientId: appointments.patientId })
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .all();

    const historyPatientIds = historyPatients.map((a) => a.patientId);

    const baseCondition = eq(users.role, 'patient');

    const accessCondition =
      historyPatientIds.length > 0
        ? or(eq(users.doctorId, doctorId), inArray(users.id, historyPatientIds))
        : eq(users.doctorId, doctorId);

    const whereClause = and(baseCondition, accessCondition);

    const countResult = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(whereClause)
      .all();
    const total = Number(countResult[0]?.count ?? 0);

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
      .where(whereClause)
      .limit(safeLimit)
      .offset(offset)
      .all();

    const data = decryptUserRecords(patients, [
      'id',
      'email',
      'name',
      'role',
      'doctorId',
      'createdAt',
      'updatedAt',
    ]);

    return {
      data,
      page: safePage,
      limit: safeLimit,
      total,
      hasMore: offset + data.length < total,
    };
  },

  async getPatientDetails(requesterId: number, patientId: number) {
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

    const requesterAppointments = db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.doctorId, requesterId)
        )
      )
      .all();

    const isAssigned = patient[0].doctorId === requesterId;
    const hasHistory = requesterAppointments.length > 0;

    if (!isAssigned && !hasHistory) {
      throw new ServiceError('Patient not found', 404);
    }

    const allPatientAppointments = db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .all();

    let patientMedications: {
      id: number;
      appointmentId: number;
      name: string;
      dosage: string;
      instructions: string;
    }[] = [];

    if (allPatientAppointments.length > 0) {
      const appointmentIds = allPatientAppointments.map((a) => a.id);
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

    logger
      .getAuditLogger()
      ?.logPhiAccess(requesterId, patientId, 'Patient Record', patientId);

    return {
      ...decryptUserFields(patient[0]),
      appointments: decryptAppointmentRecords(allPatientAppointments),
      medications: decryptMedicationRecords(patientMedications),
    };
  },
};
