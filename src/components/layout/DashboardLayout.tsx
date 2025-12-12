'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
import {
  LogOut,
  User,
  LayoutDashboard,
  Shield,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import type { UserRole } from '@/lib/db/types';
import { getRoleRoute } from '@/lib/routes';
import { Button, LoadingSpinner } from '@/components/ui';

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function DashboardLayout({
  children,
  allowedRoles,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const { userQuery, setUser, logout } = useAuth();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router, _hasHydrated]);

  useEffect(() => {
    if (userQuery.data && !user) {
      setUser(userQuery.data);
    }
  }, [userQuery.data, user, setUser]);

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      const correctRoute = getRoleRoute(user.role);
      if (pathname !== correctRoute) {
        router.replace(correctRoute);
      }
    }
  }, [user, allowedRoles, router, pathname]);

  const showFullPageLoading =
    !_hasHydrated || !isAuthenticated || userQuery.isPending || !user;

  if (showFullPageLoading) {
    return (
      <div className="min-h-dvh bg-white">
        <div className="grid min-h-dvh place-items-center px-6">
          <div className="w-full max-w-sm border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-950">Loading</p>
              <LoadingSpinner size="sm" />
            </div>
            <div className="mt-6 h-1 w-full bg-slate-100">
              <div className="h-1 w-1/2 bg-teal-600" />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Restoring session and syncing permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (userQuery.isError) {
    return (
      <div className="min-h-dvh bg-white">
        <div className="grid min-h-dvh place-items-center px-6">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">
                  Session error
                </p>
                <p className="text-sm text-slate-600">
                  We couldn&apos;t load your user profile. Sign in again.
                </p>
              </div>
              <div className="grid h-9 w-9 place-items-center border border-slate-200 bg-slate-50 text-teal-700">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={logout}>Return to login</Button>
              <button
                className="text-left text-sm font-semibold text-teal-700 hover:text-teal-800"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-dvh bg-white">
        <div className="grid min-h-dvh place-items-center px-6">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">
                  Not allowed
                </p>
                <p className="text-sm text-slate-600">
                  This page isn&apos;t available for your role.
                </p>
              </div>
              <div className="grid h-9 w-9 place-items-center border border-slate-200 bg-slate-50 text-slate-700">
                <User className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={() => router.replace(getRoleRoute(user.role))}>
                Go to my dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel = user.role.toUpperCase();
  const roleIcon =
    user.role === 'admin'
      ? Shield
      : user.role === 'doctor'
        ? Stethoscope
        : user.role === 'nurse'
          ? ClipboardList
          : LayoutDashboard;

  const RoleIcon = roleIcon;

  return (
    <div className="min-h-dvh bg-white">
      <div className="flex min-h-dvh">
        {/* left rail */}
        <aside className="w-16 border-r border-slate-200 bg-white">
          <div className="flex h-16 items-center justify-center border-b border-slate-200">
            <Link
              href={getRoleRoute(user.role)}
              className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-teal-700 hover:bg-slate-50"
              aria-label="Dashboard"
            >
              <RoleIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-3 px-3 py-6">
            <Link
              href={getRoleRoute(user.role)}
              className={`grid h-10 w-10 place-items-center border text-slate-700 hover:bg-slate-50 ${
                pathname === getRoleRoute(user.role)
                  ? 'border-teal-300 bg-teal-50 text-teal-800'
                  : 'border-slate-300 bg-white'
              }`}
              aria-label="Home"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>

            <button
              onClick={logout}
              className="grid h-10 w-10 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                  {roleLabel}
                </p>
                <p className="truncate text-sm font-semibold text-slate-950">
                  {user.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-slate-600 sm:block">
                  {user.email}
                </span>
                <Link
                  href="/account"
                  className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-sm font-semibold text-teal-800 hover:bg-slate-50"
                  aria-label="Account"
                >
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-6 py-6">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
