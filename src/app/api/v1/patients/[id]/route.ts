import { db } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import {
  decryptUserFields,
  decryptAppointmentRecords,
  decryptMedicationRecords,
} from '@/lib/security/fields';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctors can view patient details',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const userId = session.userId;

  const { id } = await params;
  const patientId = parseInt(id);

  if (isNaN(patientId) || patientId <= 0) {
    logger.info({
      message: 'Invalid patient ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid patient ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

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
    logger.info({
      message: 'Patient not found',
      meta: { patientId },
    });

    return NextResponse.json(
      { error: 'Patient not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  const patientAppointments = db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.patientId, patientId),
        eq(appointments.doctorId, userId)
      )
    )
    .all();

  const isAssigned = patient[0].doctorId === userId;
  const hasHistory = patientAppointments.length > 0;

  if (!isAssigned && !hasHistory) {
    logger.info({
      message: 'Unauthorized: Doctor has no relationship with patient',
      meta: { patientId, doctorId: userId },
    });

    return NextResponse.json(
      { error: 'Patient not found' },
      { status: STATUS.NOT_FOUND }
    );
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

  logger
    .getAuditLogger()
    ?.logPhiAccess(userId, patientId, 'Patient Record', patientId);

  return NextResponse.json({
    ...decryptUserFields(patient[0]),
    appointments: decryptAppointmentRecords(patientAppointments),
    medications: decryptMedicationRecords(patientMedications),
  });
}
