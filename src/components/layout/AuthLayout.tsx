import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="grid h-10 w-10 place-items-center border border-slate-300 bg-white text-base font-extrabold tracking-tight text-teal-700 shadow-sm rounded-md">
          HC
        </div>
        <div>
          <p className="text-base font-bold text-slate-950">HealthCare</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Secure portal
          </p>
        </div>
      </div>

      <div className="w-full max-w-[480px]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <div className="mt-2 text-sm text-slate-600">{subtitle}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {children}
        </div>

        <div className="mt-8 flex justify-center">
    
        </div>
      </div>
    </div>
  );
}
