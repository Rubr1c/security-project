import { STATUS } from '@/lib/http/status-codes';
import { logger } from '@/lib/logger';
import { getSession } from '@/lib/auth/get-session';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { accountService } from '@/services/account-service';
import { ServiceError } from '@/services/errors';

const AUTH_COOKIE_NAME = 'auth-token';

export async function GET() {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized: No valid session',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  try {
      const profile = await accountService.getProfile(session.userId);
      
      logger.info({
        message: 'User profile fetched',
        meta: { userId: session.userId },
      });

      return NextResponse.json(profile);
  } catch (error) {
      if (error instanceof ServiceError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error({ message: 'Get profile error', error: error as Error });
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'Unauthorized deletion attempt',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: STATUS.UNAUTHORIZED }
    );
  }

  try {
      await accountService.deleteAccount(session.userId);

      // Invalidate Session
      // Usually better to have this in the controller as it deals with HTTP cookies directly
      // Service handles business logic (logging, db update).
      const cookieStore = await cookies();
      cookieStore.delete(AUTH_COOKIE_NAME);

      return NextResponse.json(
        { message: 'Account deleted and anonymized successfully.' },
        { status: STATUS.OK }
      );
  } catch (error) {
      // accountService.deleteAccount wraps generic error with ServiceError(500) or throws.
       if (error instanceof ServiceError) {
          return NextResponse.json({ error: error.message }, { status: error.status });
      }
      logger.error({ message: 'Delete account error', error: error as Error });
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
