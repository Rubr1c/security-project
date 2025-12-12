import type { UserRole } from '@/lib/db/types';

export const roleRouteMap: Record<UserRole, `/dashboard/${string}`> = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  admin: '/dashboard/admin',
  nurse: '/dashboard/nurse',
};

export function getRoleRoute(role: UserRole): string {
  return roleRouteMap[role];
}


