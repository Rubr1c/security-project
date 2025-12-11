import Link from 'next/link';
import { ShieldX } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800">Access Denied</h1>
        <p className="mt-2 text-slate-500">
          You don&apos;t have permission to access this resource.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition hover:bg-emerald-700"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
