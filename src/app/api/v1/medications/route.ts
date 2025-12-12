import { db } from '@/lib/db/client';
import { appointments, medications } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { decryptMedicationRecords } from '@/lib/security/fields';

export async function GET() {
  const session = await getSession();

  if (!session || !['patient', 'doctor'].includes(session.role)) {
    logger.info({
      message: 'Unauthorized: Only patients and doctors can view medications',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

  let userAppointments;

  if (userRole === 'patient') {
    userAppointments = db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.patientId, userId))
      .all();
  } else {
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

  return NextResponse.json(decryptMedicationRecords(userMedications));
}
