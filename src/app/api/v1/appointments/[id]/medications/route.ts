import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { addMedicationSchema } from '@/lib/validation/medication-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { appointmentService } from '@/services/appointment-service';
import { ServiceError } from '@/services/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await requireRole('patient', 'doctor', 'nurse');

  if (!session) {
    logger.info({
      message:
        'Unauthorized: Only patients, doctors, and nurses can view medications',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

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

  try {
    const medications = await appointmentService.getMedications(
      appointmentId,
      userId,
      userRole
    );

    logger.info({
      message: 'Medications fetched',
      meta: {
        appointmentId,
        userId,
        role: userRole,
        count: medications.length,
      },
    });

    return NextResponse.json(medications);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Get medications error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor', 'nurse');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctors and nurses can add medications',
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

  try {
    const medication = await appointmentService.addMedication(
      appointmentId,
      session.userId,
      session.role,
      result.output
    );

    logger.info({
      message: 'Medication added successfully',
      meta: {
        medicationId: medication.medicationId,
        appointmentId,
        userId: session.userId,
        role: session.role,
        name: result.output.name,
      },
    });

    return NextResponse.json(
      {
        message: 'Medication added successfully',
        medicationId: medication.medicationId,
      },
      { status: STATUS.CREATED }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Add medication error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
