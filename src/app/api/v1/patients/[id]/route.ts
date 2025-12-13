import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { patientService } from '@/services/patient-service';
import { ServiceError } from '@/services/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctors can view patient details',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const patientId = parseInt(id);

  if (isNaN(patientId) || patientId <= 0) {
    logger.info({
      message: 'Invalid patient ID',
      meta: { id },
    });

    return NextResponse.json(
      { error: 'Invalid patient ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    const patientDetails = await patientService.getPatientDetails(
      session.userId,
      patientId
    );

    // Log for controller level (PHI access logged in service)
    logger.info({
      message: 'Patient details access',
      meta: { doctorId: session.userId, patientId },
    });

    return NextResponse.json(patientDetails);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({
      message: 'Get patient details error',
      error: error as Error,
    });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
