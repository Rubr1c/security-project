import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';

import { logService } from '@/services/log-service';

export async function GET() {
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
    const logs = await logService.getAllLogs();

    logger.info({
      message: 'Logs fetched successfully',
      meta: {
        count: logs.length,
        userId: session.userId,
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    // logService doesn't throw ServiceError currently but for consistency
    logger.error({ message: 'Get logs error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
