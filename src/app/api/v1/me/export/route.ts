import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { accountService } from '@/services/account-service';
import { ServiceError } from '@/services/errors';

export async function GET() {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized export attempt',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  try {
    const exportData = await accountService.exportUserData(session.userId);

    // Logging is handled in service for strict compliance

    return NextResponse.json(exportData);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error({ message: 'Export data error', error: error as Error });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
