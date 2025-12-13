import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { nurseService } from '@/services/nurse-service';
import { ServiceError } from '@/services/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctor can assign nurses',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const nurseId = parseInt(id);

  if (isNaN(nurseId) || nurseId <= 0) {
    return NextResponse.json(
      { error: 'Invalid nurse ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    await nurseService.assignNurse(nurseId, session.userId);

    logger.info({
      message: 'Nurse assigned to doctor',
      meta: {
        nurseId,
        doctorId: session.userId,
      },
    });

    return NextResponse.json(
      { message: 'Nurse assigned to doctor' },
      { status: STATUS.OK }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Assign nurse error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await requireRole('doctor');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only doctor can unassign nurses',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const nurseId = parseInt(id);

  if (isNaN(nurseId) || nurseId <= 0) {
    return NextResponse.json(
      { error: 'Invalid nurse ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    await nurseService.unassignNurse(nurseId, session.userId);

    logger.info({
      message: 'Nurse unassigned from doctor',
      meta: {
        nurseId,
        doctorId: session.userId,
      },
    });

    return NextResponse.json(
      { message: 'Nurse unassigned from doctor' },
      { status: STATUS.OK }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Unassign nurse error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
