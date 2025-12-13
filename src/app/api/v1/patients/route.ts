import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextRequest, NextResponse } from 'next/server';
import { patientService } from '@/services/patient-service';
import { ServiceError } from '@/services/errors';

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const result = await patientService.getPatientsForDoctor(
      session.userId,
      Number.isNaN(page) ? 1 : page,
      Number.isNaN(limit) ? 50 : limit
    );

    logger.info({
      message: 'Patients fetched',
      meta: {
        doctorId: session.userId,
        count: result.data.length,
        total: result.total,
        page: result.page,
      },
    });

    return NextResponse.json(result);
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
