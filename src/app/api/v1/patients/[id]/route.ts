import { db } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const userRole = req.headers.get('x-user-role');
  const userId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Only doctors can view patient details
  if (userRole !== 'doctor') {
    logger.info({
      message: 'Unauthorized: Only doctors can view patient details',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': userRole ?? 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

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

  // Verify the patient exists and is assigned to this doctor
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
    .where(
      and(
        eq(users.id, patientId),
        eq(users.role, 'patient'),
        eq(users.doctorId, userId)
      )
    )
    .all();

  if (patient.length === 0) {
    logger.info({
      message: 'Patient not found or not assigned to this doctor',
      meta: { patientId, doctorId: userId },
    });

    return NextResponse.json(
      { error: 'Patient not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Fetch all appointments for this patient with this doctor
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

  // Fetch medications for all these appointments
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

  logger.info({
    message: 'Patient details fetched',
    meta: {
      patientId,
      doctorId: userId,
      appointmentCount: patientAppointments.length,
      medicationCount: patientMedications.length,
    },
  });

  return NextResponse.json({
    ...patient[0],
    appointments: patientAppointments,
    medications: patientMedications,
  });
}
