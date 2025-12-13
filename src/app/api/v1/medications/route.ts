import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { appointmentService } from '@/services/appointment-service';
import { ServiceError } from '@/services/errors';

export async function GET() {
  const session = await requireRole('patient', 'doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only patients and doctors can view medications',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { userId, role: userRole } = session;

  try {
    const medications = await appointmentService.getAllMedications(
      userId,
      userRole
    );

    logger.info({
      message: 'All medications fetched',
      meta: {
        userId,
        role: userRole,
        medicationCount: medications.length,
      },
    });

    return NextResponse.json(medications);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({
      message: 'Get all medications error',
      error: error as Error,
    });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
