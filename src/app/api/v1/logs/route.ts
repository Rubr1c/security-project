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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await logService.getLogs(page, limit);

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
