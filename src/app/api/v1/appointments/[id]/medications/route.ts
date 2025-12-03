import { db } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { addMedicationSchema } from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  if (req.headers.get('x-user-role') !== 'nurse') {
    logger.info({
      message: 'Unauthorized: Only nurses can add medications',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const appointmentId = parseInt(id);

  if (isNaN(appointmentId) || appointmentId <= 0) {
    logger.info({
      message: 'Invalid appointment ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid appointment ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const body = await req.json();
  const result = v.safeParse(addMedicationSchema, body);

  if (!result.success) {
    logger.info({ message: 'Invalid add medication request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const nurseId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Get the nurse to find their assigned doctor
  const nurse = db.select().from(users).where(eq(users.id, nurseId)).all();

  if (nurse.length === 0 || nurse[0].doctorId === null) {
    logger.info({
      message: 'Nurse not found or not assigned to a doctor',
      meta: { nurseId },
    });

    return NextResponse.json(
      { error: 'Nurse is not assigned to a doctor' },
      { status: STATUS.FORBIDDEN }
    );
  }

  // Verify the appointment exists and belongs to the nurse's assigned doctor
  const appointment = db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .all();

  if (appointment.length === 0) {
    logger.info({
      message: 'Appointment not found',
      meta: { appointmentId },
    });

    return NextResponse.json(
      { error: 'Appointment not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Verify the nurse is assigned to the doctor of this appointment
  if (appointment[0].doctorId !== nurse[0].doctorId) {
    logger.info({
      message: 'Nurse is not authorized to add medications to this appointment',
      meta: {
        nurseId,
        nurseAssignedDoctorId: nurse[0].doctorId,
        appointmentDoctorId: appointment[0].doctorId,
      },
    });

    return NextResponse.json(
      { error: 'Not authorized to add medications to this appointment' },
      { status: STATUS.FORBIDDEN }
    );
  }

  const insertResult = db
    .insert(medications)
    .values({
      appointmentId,
      name: result.output.name,
      dosage: result.output.dosage,
      instructions: result.output.instructions,
    })
    .run();

  logger.info({
    message: 'Medication added successfully',
    meta: {
      medicationId: insertResult.lastInsertRowid,
      appointmentId,
      nurseId,
      name: result.output.name,
    },
  });

  return NextResponse.json(
    {
      message: 'Medication added successfully',
      medicationId: insertResult.lastInsertRowid,
    },
    { status: STATUS.CREATED }
  );
}

