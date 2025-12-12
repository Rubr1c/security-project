import { db } from '@/lib/db/client';
import { appointments, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession, requireRole } from '@/lib/auth/get-session';
import { createAppointmentSchema } from '@/lib/validation/appointment-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq, and, aliasedTable, getTableColumns } from 'drizzle-orm';
import { decryptAppointmentRecords } from '@/lib/security/fields';
import { decrypt } from '@/lib/security/crypto';

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

  const patientId = session.userId;

  const doctor = db
    .select({ id: users.id, role: users.role })
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

export async function GET() {
  const session = await getSession();

  if (!session || !['patient', 'doctor', 'nurse'].includes(session.role)) {
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

  const doctors = aliasedTable(users, 'doctors');
  const patients = aliasedTable(users, 'patients');

  let baseQuery = db
    .select({
      ...getTableColumns(appointments),
      doctorName: doctors.name,
      patientName: patients.name,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(patients, eq(appointments.patientId, patients.id));

  let userAppointments;

  if (userRole === 'patient') {
    userAppointments = baseQuery.where(eq(appointments.patientId, userId)).all();
  } else if (userRole === 'doctor') {
    userAppointments = baseQuery.where(eq(appointments.doctorId, userId)).all();
  } else {
    // Nurse
    const nurse = db
      .select({ id: users.id, doctorId: users.doctorId })
      .from(users)
      .where(eq(users.id, userId))
      .all();

    if (nurse.length === 0 || nurse[0].doctorId === null) {
      logger.info({
        message: 'Nurse not assigned to a doctor',
        meta: { nurseId: userId },
      });

      return NextResponse.json([]);
    }

    userAppointments = baseQuery
      .where(eq(appointments.doctorId, nurse[0].doctorId))
      .all();
  }

  logger.info({
    message: 'Appointments fetched',
    meta: {
      userId,
      role: userRole,
      count: userAppointments.length,
      withNames: true,
    },
  });

  const decryptedAppointments = decryptAppointmentRecords(userAppointments);
  
  // Manually decrypt the joined name fields
  const finalAppointments = decryptedAppointments.map((apt) => ({
    ...apt,
    doctorName: apt.doctorName ? decrypt(apt.doctorName) : undefined,
    patientName: apt.patientName ? decrypt(apt.patientName) : undefined,
  }));

  return NextResponse.json(finalAppointments);
}
