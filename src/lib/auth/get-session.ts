import { cookies } from 'next/headers';
import { jwt, JwtPayload } from '@/lib/jwt';
import { UserRole } from '@/lib/db/types';
import { logger } from '../logger';

const AUTH_COOKIE_NAME = 'auth-token';

export interface Session {
  userId: number;
  role: UserRole;
}

export async function getSession(): Promise<Session | null> {
  logger.info({
    message: 'Getting session',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    logger.info({
      message: 'No auth cookie found',
    });
    return null;
  }

  const decoded = await jwt.verify<JwtPayload>(token);

  if (!decoded || typeof decoded.userId !== 'number' || !decoded.role) {
    logger.info({
      message: 'Invalid token',
    });
    return null;
  }

  logger.info({
    message: 'Session retrieved',
    meta: {
      userId: decoded.userId,
      role: decoded.role,
    },
  });

  return {
    userId: decoded.userId,
    role: decoded.role,
  };
}

export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<Session | null> {
  const session = await getSession();

  if (!session) {
    logger.info({
      message: 'No session found',
    });
    return null;
  }

  if (!allowedRoles.includes(session.role)) {
    logger.info({
      message: 'User does not have required role',
      meta: {
        userId: session.userId,
        role: session.role,
        allowedRoles,
      },
    });
    return null;
  }

  logger.info({
    message: 'User has required role',
    meta: {
      userId: session.userId,
      role: session.role,
      allowedRoles,
    },
  });

  return session;
}
