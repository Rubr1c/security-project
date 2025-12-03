import { db } from '@/lib/db/client';
import { appointments, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { createAppointmentSchema } from '@/lib/validation/user-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  if (req.headers.get('x-user-role') !== 'patient') {
    logger.info({
      message: 'Unauthorized: Only patients can request appointments',
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

  const body = await req.json();
  const result = v.safeParse(createAppointmentSchema, body);

  if (!result.success) {
    logger.info({ message: 'Invalid appointment request', meta: body });

    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const patientId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Verify the doctor exists and is actually a doctor
  const doctor = db
    .select()
    .from(users)
    .where(and(eq(users.id, result.output.doctorId), eq(users.role, 'doctor')))
    .all();

  if (doctor.length === 0) {
    logger.info({
      message: 'Doctor not found',
      meta: { doctorId: result.output.doctorId },
    });

    return NextResponse.json(
      { error: 'Doctor not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Validate appointment date is in the future
  const appointmentDate = new Date(result.output.date);
  if (appointmentDate <= new Date()) {
    logger.info({
      message: 'Appointment date must be in the future',
      meta: { date: result.output.date },
    });

    return NextResponse.json(
      { error: 'Appointment date must be in the future' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const insertResult = db
    .insert(appointments)
    .values({
      patientId,
      doctorId: result.output.doctorId,
      date: result.output.date,
      status: 'pending',
    })
    .run();

  logger.info({
    message: 'Appointment requested successfully',
    meta: {
      appointmentId: insertResult.lastInsertRowid,
      patientId,
      doctorId: result.output.doctorId,
      date: result.output.date,
    },
  });

  return NextResponse.json(
    {
      message: 'Appointment request submitted. Awaiting doctor approval.',
      appointmentId: insertResult.lastInsertRowid,
    },
    { status: STATUS.CREATED }
  );
}

export async function GET(req: Request) {
  const userRole = req.headers.get('x-user-role');
  const userId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Both patients and doctors can view their appointments
  if (userRole !== 'patient' && userRole !== 'doctor') {
    logger.info({
      message: 'Unauthorized: Only patients and doctors can view appointments',
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

  let userAppointments;

  if (userRole === 'patient') {
    userAppointments = db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, userId))
      .all();
  } else {
    // Doctor - get all appointments assigned to them
    userAppointments = db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, userId))
      .all();
  }

  logger.info({
    message: 'Appointments fetched',
    meta: {
      userId,
      role: userRole,
      count: userAppointments.length,
    },
  });

  return NextResponse.json(userAppointments);
}
