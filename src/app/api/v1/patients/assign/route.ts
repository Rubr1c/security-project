import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { assignPatientSchema } from '@/lib/validation/actions-sechmas';
import * as v from 'valibot';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  if (req.headers.get('x-user-role') !== 'doctor') {
    logger.info({
      message: 'Unauthorized',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
    });
  }

  const body = await req.json();
  const result = v.safeParse(assignPatientSchema, body);

  if (!result.success) {
    logger.info({ message: 'Invalid assign patient request', meta: body });
    return NextResponse.json(
      { error: result.issues[0].message },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const patient = await db
    .select()
    .from(users)
    .where(eq(users.email, result.output.patientEmail))
    .all();

  if (patient.length === 0) {
    logger.info({ message: 'Patient not found', meta: result.output });
    return NextResponse.json(
      { error: 'Patient not found' },
      { status: STATUS.NOT_FOUND }
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
