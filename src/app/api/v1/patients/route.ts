import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { patientService } from '@/services/patient-service';
import { ServiceError } from '@/services/errors';

export async function GET() {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  try {
    const patients = await patientService.getPatientsForDoctor(session.userId);

    logger.info({
      message: 'Patients fetched',
      meta: {
        doctorId: session.userId,
        count: patients.length,
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Get patients error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
