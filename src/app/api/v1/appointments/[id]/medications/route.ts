import { db } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession, requireRole } from '@/lib/auth/get-session';
import { addMedicationSchema } from '@/lib/validation/medication-schemas';
import { NextResponse } from 'next/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/security/crypto';
import { decryptMedicationRecords } from '@/lib/security/fields';

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
        message: 'Patient attempting to view medications for another patient',
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
        message: 'Doctor attempting to view medications for another doctor',
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
  } else if (userRole === 'nurse') {
    const nurse = db
      .select({ id: users.id, doctorId: users.doctorId })
      .from(users)
      .where(eq(users.id, userId))
      .all();

    if (
      nurse.length === 0 ||
      nurse[0].doctorId === null ||
      nurse[0].doctorId !== appointment[0].doctorId
    ) {
      logger.info({
        message:
          'Nurse not authorized to view medications for this appointment',
        meta: {
          nurseId: userId,
          nurseAssignedDoctorId: nurse[0]?.doctorId,
          appointmentDoctorId: appointment[0].doctorId,
        },
      });

      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: STATUS.NOT_FOUND }
      );
    }
  }

  const appointmentMedications = db
    .select()
    .from(medications)
    .where(eq(medications.appointmentId, appointmentId))
    .all();

  logger.info({
    message: 'Medications fetched',
    meta: {
      appointmentId,
      userId,
      role: userRole,
      count: appointmentMedications.length,
    },
  });

  return NextResponse.json(decryptMedicationRecords(appointmentMedications));
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

  const userId = session.userId;
  const userRole = session.role;

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

  if (userRole === 'doctor') {
    if (appointment[0].doctorId !== userId) {
      logger.info({
        message: 'Doctor attempting to add medication to another doctor\'s appointment',
        meta: {
          requestingDoctorId: userId,
          appointmentDoctorId: appointment[0].doctorId,
        },
      });

      return NextResponse.json(
        { error: 'Not authorized to add medications to this appointment' },
        { status: STATUS.FORBIDDEN }
      );
    }
  } else {
    // Nurse
    const nurse = db
      .select({ id: users.id, doctorId: users.doctorId })
      .from(users)
      .where(eq(users.id, userId))
      .all();

    if (nurse.length === 0 || nurse[0].doctorId === null) {
      logger.info({
        message: 'Nurse not found or not assigned to a doctor',
        meta: { nurseId: userId },
      });

      return NextResponse.json(
        { error: 'Nurse is not assigned to a doctor' },
        { status: STATUS.FORBIDDEN }
      );
    }

    if (appointment[0].doctorId !== nurse[0].doctorId) {
      logger.info({
        message:
          'Nurse is not authorized to add medications to this appointment',
        meta: {
          nurseId: userId,
          nurseAssignedDoctorId: nurse[0].doctorId,
          appointmentDoctorId: appointment[0].doctorId,
        },
      });

      return NextResponse.json(
        { error: 'Not authorized to add medications to this appointment' },
        { status: STATUS.FORBIDDEN }
      );
    }
  }

  const insertResult = db
    .insert(medications)
    .values({
      appointmentId,
      name: encrypt(result.output.name),
      dosage: encrypt(result.output.dosage),
      instructions: encrypt(result.output.instructions),
    })
    .run();

  logger.info({
    message: 'Medication added successfully',
    meta: {
      medicationId: insertResult.lastInsertRowid,
      appointmentId,
      userId,
      role: userRole,
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
