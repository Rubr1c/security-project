'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/db/types';

const roleRouteMap: Record<UserRole, string> = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  admin: '/dashboard/admin',
  nurse: '/dashboard/nurse',
};

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { userQuery, setUser } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
  }, [token, router]);

  useEffect(() => {
    if (userQuery.data && !user) {
      setUser(userQuery.data);
    }
  }, [userQuery.data, user, setUser]);

  useEffect(() => {
    if (user) {
      router.replace(roleRouteMap[user.role]);
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-slate-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}

