import { db } from '@/lib/db/client';
import { appointments, medications, users } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import {
  decryptUserFields,
  decryptAppointmentRecords,
  decryptMedicationRecords,
} from '@/lib/security/fields';

export async function GET() {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized export attempt',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const userId = session.userId;

  // Fetch User Profile
  const user = db.select().from(users).where(eq(users.id, userId)).get();

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Fetch All Appointments
  const userAppointments = db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, userId))
    .all();

  // Fetch All Medications
  let userMedications: (typeof medications.$inferSelect)[] = [];

  if (userAppointments.length > 0) {
    const appointmentIds = userAppointments.map((a) => a.id);
    userMedications = db
      .select()
      .from(medications)
      .where(inArray(medications.appointmentId, appointmentIds))
      .all();
  }

  // Strict Compliance Logging
  logger.getAuditLogger()?.logDataExport(userId, userId);

  return NextResponse.json({
    user: decryptUserFields(user),
    appointments: decryptAppointmentRecords(userAppointments),
    medications: decryptMedicationRecords(userMedications),
    metadata: {
      exportedAt: new Date().toISOString(),
      compliance: 'GDPR Article 20 / HIPAA Right of Access',
    },
  });
}
