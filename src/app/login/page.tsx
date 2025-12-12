import { LoginForm } from '@/components/forms/LoginForm';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-white">
      <div className="grid min-h-dvh lg:grid-cols-[420px_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="px-6 py-12">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-sm font-extrabold tracking-tight text-teal-700">
                HC
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">HealthCare</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Secure portal
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                Sign in
              </h1>
              <p className="text-sm leading-6 text-slate-700">
                This workspace uses role-based access. Your dashboard is selected
                automatically after login.
              </p>
              <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-6 py-6">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">
                  Sessions are verified on every API request.
                </p>
              </div>

              <Link
                href="/register"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                New here? Create an account <ArrowRight className="inline h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>

        <main className="px-6 py-12">
          <div className="mx-auto w-full max-w-[520px]">
            <div className="border border-slate-200 bg-white p-6">
              <LoginForm />
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-700">
                No account yet?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-teal-700 hover:text-teal-800"
                >
                  Create one
                </Link>
                .
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
