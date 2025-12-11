'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (userQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (userQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-red-600">Failed to load user data</p>
        <button
          onClick={logout}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700"
        >
          Return to Login
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <User className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Access Denied</h1>
        <p className="text-slate-500">
          You don&apos;t have permission to access this page
        </p>
        <button
          onClick={() => router.replace(roleRouteMap[user.role])}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700"
        >
          Go to Your Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
              <span className="text-lg font-bold text-white">HC</span>
            </div>
            <span className="text-xl font-semibold text-slate-800">
              HealthCare
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-800">{user.name}</p>
                <p className="text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
