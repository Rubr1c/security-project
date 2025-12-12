import { cookies } from 'next/headers';
import { jwt, JwtPayload } from '@/lib/jwt';
import { UserRole } from '@/lib/db/types';

const AUTH_COOKIE_NAME = 'auth-token';

export interface Session {
  userId: number;
  role: UserRole;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const decoded = await jwt.verify<JwtPayload>(token);

  if (!decoded || typeof decoded.userId !== 'number' || !decoded.role) {
    return null;
  }

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
    return null;
  }

  if (!allowedRoles.includes(session.role)) {
    return null;
  }

  return session;
}
