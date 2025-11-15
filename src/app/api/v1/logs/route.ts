import { db } from '@/lib/db/client';
import { logs } from '@/lib/db/schema';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  if (req.headers.get('x-user-role') !== 'admin') {
    logger.info({
      message: 'Unauthorized',
      meta: {
        'x-user-id': req.headers.get('x-user-id') ?? 'unknown',
        'x-user-role': req.headers.get('x-user-role') ?? 'unknown',
      },
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
    },
  });
  return NextResponse.json(result);
}
