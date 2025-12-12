'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { useAuthStore } from '@/store/auth';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <DashboardLayout allowedRoles={['admin', 'doctor', 'nurse', 'patient']}>
      <div className="grid gap-9">
        <div className="border-l-4 border-teal-600 pl-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Security
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Change your password. A verification code will be emailed to you.
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Signed in as
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {user?.email ?? '—'}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Change password
          </p>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


