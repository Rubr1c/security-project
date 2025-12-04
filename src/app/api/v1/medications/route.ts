import { db } from '@/lib/db/client';
import { appointments, medications } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  const userRole = req.headers.get('x-user-role');
  const userId = parseInt(req.headers.get('x-user-id') ?? '0');

  // Only patients and doctors can view medications
  if (userRole !== 'patient' && userRole !== 'doctor') {
    logger.info({
      message: 'Unauthorized: Only patients and doctors can view medications',
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

  // Get all appointments for this user based on role
  let userAppointments;

  if (userRole === 'patient') {
    userAppointments = db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.patientId, userId))
      .all();
  } else {
    // Doctor - get all their appointments
    userAppointments = db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.doctorId, userId))
      .all();
  }

  if (userAppointments.length === 0) {
    logger.info({
      message: 'No appointments found',
      meta: { userId, role: userRole },
    });

    return NextResponse.json([]);
  }

  const appointmentIds = userAppointments.map((a) => a.id);

  // Fetch all medications for these appointments
  const userMedications = db
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

  logger.info({
    message: 'All medications fetched',
    meta: {
      userId,
      role: userRole,
      appointmentCount: appointmentIds.length,
      medicationCount: userMedications.length,
    },
  });

  return NextResponse.json(userMedications);
}
