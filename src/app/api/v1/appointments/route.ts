import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { createAppointmentSchema } from '@/lib/validation/appointment-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { appointmentService } from '@/services/appointment-service';
import { ServiceError } from '@/services/errors';

export async function POST(req: Request) {
  const session = await requireRole('patient');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only patients can request appointments',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const body = await req.json();
  const result = v.safeParse(createAppointmentSchema, body);

  if (!result.success) {
    logger.info({ message: 'Invalid appointment request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    const appointment = await appointmentService.createAppointment(
      session.userId,
      result.output
    );

    logger.info({
      message: 'Appointment requested successfully',
      meta: appointment,
    });

    return NextResponse.json(
      {
        message: 'Appointment request submitted. Awaiting doctor approval.',
        appointmentId: appointment.appointmentId,
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
    logger.error({
      message: 'Create appointment error',
      error: error as Error,
    });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireRole('patient', 'doctor', 'nurse');

  if (!session) {
    logger.info({
      message:
        'Unauthorized: Only patients, doctors, and nurses can view appointments',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

  try {
    const appointments = await appointmentService.getAppointments(
      userId,
      userRole
    );

    logger.info({
      message: 'Appointments fetched',
      meta: {
        userId,
        role: userRole,
        count: appointments.length,
        withNames: true,
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    // ServiceError usually not expected here unless DB fails, but good practice
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Get appointments error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
