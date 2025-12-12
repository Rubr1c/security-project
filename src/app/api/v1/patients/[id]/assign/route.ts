import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (req.headers.get('x-user-role') !== 'doctor') {
    logger.info({
      message: 'Unauthorized',
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

  const patientId = parseInt(params.id);

  const patient = db.select().from(users).where(eq(users.id, patientId)).all();

  if (patient.length === 0) {
    logger.info({ message: 'Patient not found', meta: patientId });
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: STATUS.NOT_FOUND }
    );
  }

  // Ensure the target is actually a patient (prevents assigning nurses/admins/doctors by mistake)
  if (patient[0].role !== 'patient') {
    logger.info({
      message: 'Assign patient rejected: target user is not a patient',
      meta: { targetId: patientId, targetRole: patient[0].role },
    });

    return NextResponse.json(
      { error: 'Target user is not a patient' },
      { status: STATUS.BAD_REQUEST }
    );
  }
  //Impossible to have multiple patients with the same email
  if (patient.length > 1) {
    throw new Error('Multiple patients found');
  }

  const doctorId = parseInt(req.headers.get('x-user-id') ?? '0');

  await db
    .update(users)
    .set({ doctorId: doctorId })
    .where(eq(users.id, patient[0].id));

  logger.info({
    message: 'Patient assigned to doctor',
    meta: { patientId: patient[0].id, doctorId: doctorId },
  });

  return NextResponse.json(
    { message: 'Patient assigned to doctor' },
    { status: STATUS.OK }
  );
}
