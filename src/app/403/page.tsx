'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

export default function ForbiddenPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="text-center">
        <div className="text-8xl">🚫</div>
        <h1 className="mt-6 text-4xl font-bold text-white">403</h1>
        <h2 className="mt-2 text-xl font-medium text-slate-300">Access Forbidden</h2>
        <p className="mt-4 max-w-md text-slate-400">
          You don&apos;t have permission to access this page. Please contact your
          administrator if you believe this is a mistake.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => router.back()} variant="secondary">
            Go Back
          </Button>
          <Button
            onClick={() =>
              router.push(isAuthenticated ? '/dashboard' : '/login')
            }
          >
            {isAuthenticated ? 'Dashboard' : 'Login'}
          </Button>
        </div>
      </div>
    </div>
  );
}

