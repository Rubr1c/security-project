'use client';

import Link from 'next/link';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { ArrowRight, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-dvh bg-white">
      <div className="grid min-h-dvh lg:grid-cols-[1fr_420px]">
        <main className="px-6 py-12">
          <div className="mx-auto w-full max-w-[700px]">
            <div className="flex items-center justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-sm font-extrabold tracking-tight text-teal-700">
                  HC
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">HealthCare</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Patient registration
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Sign in <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-9">
              <div className="grid gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  Create your patient account
                </h1>
                <p className="text-sm leading-6 text-slate-700">
                  You&apos;ll be able to book appointments and review prescribed
                  medications. Staff accounts are created by admins.
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-6">
                <RegisterForm />
              </div>

              <p className="text-sm text-slate-700">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-teal-700 hover:text-teal-800"
                >
                  Sign in
                </Link>
                .
              </p>
            </div>
          </div>
        </main>

        <aside className="border-t border-slate-200 bg-slate-50 lg:border-t-0 lg:border-l">
          <div className="px-6 py-12">
            <div className="grid gap-6">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-teal-700">
                  <UserPlus className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  What you get after signup
                </p>
              </div>

              <div className="grid gap-6">
                <div className="border-l-4 border-teal-600 pl-6">
                  <p className="text-sm font-semibold text-slate-950">
                    Appointment requests
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    Pick a doctor and choose a time. Track confirmation status.
                  </p>
                </div>
                <div className="border-l-4 border-teal-600 pl-6">
                  <p className="text-sm font-semibold text-slate-950">
                    Medication history
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    View medications linked to your completed appointments.
                  </p>
                </div>
                <div className="border-l-4 border-teal-600 pl-6">
                  <p className="text-sm font-semibold text-slate-950">
                    Secure access
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    Tokens are validated and requests are audited server-side.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
