import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { doctorService } from '@/services/doctor-service';
import { ServiceError } from '@/services/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await requireRole('admin');

  if (!session) {
    logger.info({
      message: 'Unauthorized: Only admin can delete doctors',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  const { id } = await params;
  const doctorId = parseInt(id);

  if (Number.isNaN(doctorId) || doctorId <= 0) {
    return NextResponse.json(
      { error: 'Invalid doctor ID' },
      { status: STATUS.BAD_REQUEST }
    );
  }

  const url = new URL(req.url);
  const force =
    url.searchParams.get('force') === 'true' ||
    url.searchParams.get('force') === '1';

  try {
      await doctorService.deleteDoctor(doctorId, force);
      
      logger.info({
        message: 'Doctor deleted successfully',
        meta: {
          id: doctorId,
          deletedBy: session.userId,
        },
      });

      return NextResponse.json(
        { message: 'Doctor Deleted' },
        { status: STATUS.OK }
      );
  } catch (error) {
      if (error instanceof ServiceError) {
          // Map special conflict error to CONFLICT status if it matches the message
          if (error.status === 409) {
              return NextResponse.json(
                  { error: error.message },
                  { status: STATUS.CONFLICT }
              );
          }
          return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error({ message: 'Delete doctor error', error: error as Error });
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
