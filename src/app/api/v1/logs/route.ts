import { db } from '@/lib/db/client';
import { logs } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';

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

  const result = db.select().from(logs).all();

  logger.info({
    message: 'Logs fetched successfully',
    meta: {
      count: result.length,
      userId: session.userId,
    },
  });
  return NextResponse.json(result);
}
