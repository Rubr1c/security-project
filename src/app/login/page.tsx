import { LoginForm } from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <span className="text-2xl font-bold text-slate-950">HC</span>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-slate-400">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Healthcare Management System
        </p>
      </div>
    </div>
  );
}
