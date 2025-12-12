import Link from 'next/link';
import { ShieldX, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ForbiddenPage() {
  return (
    <div className="min-h-dvh bg-white">
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="w-full max-w-[720px] border border-slate-200 bg-white">
          <div className="grid gap-6 px-6 py-12 md:grid-cols-[180px_1fr]">
            <div className="border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Error
              </p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
                403
              </p>
              <div className="mt-6 grid h-9 w-9 place-items-center border border-slate-300 bg-white text-red-700">
                <ShieldX className="h-4 w-4" />
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
                  Access denied
                </h1>
                <p className="text-sm leading-6 text-slate-700">
                  You don&apos;t have permission to open this page. If you think
                  this is a mistake, sign in again and confirm your role.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/login">
                  <Button>
                    Return to login <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href="/"
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  Go home
                </Link>
              </div>
            </div>
          </div>
          <div className="h-3 bg-teal-600" />
        </div>
      </div>
    </div>
  );
}
