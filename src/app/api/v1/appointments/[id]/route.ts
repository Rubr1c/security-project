import { db } from '@/lib/db/client';
import { appointments, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const userRole = req.headers.get('x-user-role');
  const userId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Only patients and doctors can view appointment details
  if (userRole !== 'patient' && userRole !== 'doctor') {
    logger.info({
      message:
        'Unauthorized: Only patients and doctors can view appointment details',
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

  // Fetch the appointment
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

  // RBAC: Verify access rights
  if (userRole === 'patient') {
    // Patient can only view their own appointments
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
    // Doctor can only view appointments assigned to them
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

  // Fetch doctor and patient names for the response
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
