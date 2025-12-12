import { db } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Returns medications for a patient, scoped to the requesting doctor's relationship.
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctors can view patient medications',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const doctorId = session.userId;

  const { id } = await params;
  const patientId = parseInt(id);

  if (Number.isNaN(patientId) || patientId <= 0) {
    return NextResponse.json(
      { error: 'Invalid patient ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  // Verify patient exists and is assigned to this doctor
  const patient = db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.id, patientId), eq(users.role, 'patient'), eq(users.doctorId, doctorId))
    )
    .all();

  if (patient.length === 0) {
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  const appts = db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.patientId, patientId), eq(appointments.doctorId, doctorId)))
    .all();

  if (appts.length === 0) {
    return NextResponse.json([]);
  }

  const apptIds = appts.map((a) => a.id);

  const meds = db
    .select({
      id: medications.id,
      appointmentId: medications.appointmentId,
      name: medications.name,
      dosage: medications.dosage,
      instructions: medications.instructions,
    })
    .from(medications)
    .where(inArray(medications.appointmentId, apptIds))
    .all();

  logger.info({
    message: 'Patient medications fetched',
    meta: { doctorId, patientId, appointmentCount: apptIds.length, medicationCount: meds.length },
  });

  return NextResponse.json(meds);
}


