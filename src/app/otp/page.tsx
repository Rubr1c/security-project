import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { OtpVerificationForm } from '@/components/forms/OtpVerificationForm';

type OtpSearchParams = Record<string, string | string[] | undefined>;

export default async function OtpPage(
  props: {
    searchParams?: OtpSearchParams | Promise<OtpSearchParams>;
  } = {}
) {
  const resolvedSearchParams = await Promise.resolve(props.searchParams ?? {});
  const rawEmail = resolvedSearchParams.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  if (!email) {
    redirect('/login');
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="grid min-h-dvh lg:grid-cols-[420px_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-r lg:border-b-0">
          <div className="px-6 py-12">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-sm font-extrabold tracking-tight text-teal-700">
                HC
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  HealthCare
                </p>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Two-factor verification
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                Check your email
              </h1>
              <p className="text-sm leading-6 text-slate-700">
                We sent a one-time code. Enter it to finish signing in.
              </p>
              <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 px-6 py-6">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
                <p className="text-sm font-semibold text-slate-900">
                  2FA is always required for every login.
                </p>
              </div>

              <Link
                href="/login"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Use a different email
              </Link>
            </div>
          </div>
        </aside>

        <main className="px-6 py-12">
          <div className="mx-auto w-full max-w-[520px]">
            <div className="border border-slate-200 bg-white p-6">
              <OtpVerificationForm email={email} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
