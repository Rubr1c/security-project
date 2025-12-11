'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/db/types';

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const roleRouteMap: Record<UserRole, string> = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  admin: '/dashboard/admin',
  nurse: '/dashboard/nurse',
};

export function DashboardLayout({
  children,
  allowedRoles,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, user, _hasHydrated } = useAuthStore();
  const { userQuery, setUser, logout } = useAuth();

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.replace('/login');
    }
  }, [token, router, _hasHydrated]);

  useEffect(() => {
    if (userQuery.data && !user) {
      setUser(userQuery.data);
    }
  }, [userQuery.data, user, setUser]);

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      const correctRoute = roleRouteMap[user.role];
      if (pathname !== correctRoute) {
        router.replace(correctRoute);
      }
    }
  }, [user, allowedRoles, router, pathname]);

  if (!_hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (userQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (userQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <p className="text-red-400">Failed to load user data</p>
        <button
          onClick={logout}
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-400"
        >
          Return to Login
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-slate-400">
          You don&apos;t have permission to access this page
        </p>
        <button
          onClick={() => router.replace(roleRouteMap[user.role])}
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-amber-400"
        >
          Go to Your Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
              <span className="text-lg font-bold text-slate-950">HC</span>
            </div>
            <span className="text-xl font-semibold text-white">HealthCare</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-semibold text-slate-950">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-white">{user.name}</p>
                <p className="text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
