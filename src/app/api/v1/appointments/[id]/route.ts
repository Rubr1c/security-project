import { db } from '@/lib/db/client';
import { appointments, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session || !['patient', 'doctor'].includes(session.role)) {
    logger.info({
      message:
        'Unauthorized: Only patients and doctors can view appointment details',
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

  if (userRole === 'patient') {
    if (appointment[0].patientId !== userId) {
      logger.info({
        message: 'Patient attempting to view another patient appointment',
        meta: {
          requestingPatientId: userId,
          appointmentPatientId: appointment[0].patientId,
        },
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: STATUS.NOT_FOUND }
      );
    }
  } else if (userRole === 'doctor') {
    if (appointment[0].doctorId !== userId) {
      logger.info({
        message: 'Doctor attempting to view another doctor appointment',
        meta: {
          requestingDoctorId: userId,
          appointmentDoctorId: appointment[0].doctorId,
        },
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: STATUS.NOT_FOUND }
      );
    }
  }

  const doctor = db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, appointment[0].doctorId))
    .all();

  const patient = db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, appointment[0].patientId))
    .all();

  logger.info({
    message: 'Appointment details fetched',
    meta: {
      appointmentId,
      userId,
      role: userRole,
    },
  });

  return NextResponse.json({
    ...appointment[0],
    doctor: doctor[0] ?? null,
    patient: patient[0] ?? null,
  });
}
