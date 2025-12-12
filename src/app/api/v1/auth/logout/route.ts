import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';

const AUTH_COOKIE_NAME = 'auth-token';

export async function POST() {
  const session = await getSession();

  logger.info({
    message: 'User logging out',
    meta: { userId: session?.userId ?? 'anonymous' },
  });

  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);

  return NextResponse.json({ success: true }, { status: STATUS.OK });
}
