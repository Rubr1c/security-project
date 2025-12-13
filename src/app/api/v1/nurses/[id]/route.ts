import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { nurseService } from '@/services/nurse-service';
import { ServiceError } from '@/services/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await requireRole('admin');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only admin can delete nurses',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const nurseId = parseInt(id);

  if (Number.isNaN(nurseId) || nurseId <= 0) {
    return NextResponse.json(
      { error: 'Invalid nurse ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  try {
    await nurseService.deleteNurse(nurseId);

    logger.info({
      message: 'Nurse deleted successfully',
      meta: { id: nurseId, deletedBy: session.userId },
    });

    return NextResponse.json(
      { message: 'Nurse Deleted' },
      { status: STATUS.OK }
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Delete nurse error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
