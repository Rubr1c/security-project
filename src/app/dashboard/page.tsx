'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { getRoleRoute } from '@/lib/routes';
import { LoadingSpinner } from '@/components/ui';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { userQuery, setUser } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (userQuery.data && !user) {
      setUser(userQuery.data);
    }
  }, [userQuery.data, user, setUser]);

  useEffect(() => {
    if (user) {
      router.replace(getRoleRoute(user.role));
    }
  }, [user, router]);

  return (
    <div className="min-h-dvh bg-white">
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="w-full max-w-sm border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">Redirecting</p>
            <LoadingSpinner size="sm" />
          </div>
          <div className="mt-6 h-1 w-full bg-slate-100">
            <div className="h-1 w-2/3 bg-teal-600" />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Sending you to the correct workspace for your role.
          </p>
        </div>
      </div>
    </div>
  );
}
