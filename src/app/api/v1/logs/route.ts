import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextRequest, NextResponse } from 'next/server';

import { logService } from '@/services/log-service';

export async function GET(request: NextRequest) {
  const session = await requireRole('admin');

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

    const result = await logService.getLogs(
      Number.isNaN(page) ? 1 : page,
      Number.isNaN(limit) ? 50 : limit
    );

    logger.info({
      message: 'Logs fetched successfully',
      meta: {
        count: result.data.length,
        total: result.total,
        page: result.page,
        userId: session.userId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ message: 'Get logs error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
