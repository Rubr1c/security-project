import { RegisterForm } from '@/components/forms/RegisterForm';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your patient account" subtitle="">
      <div className="grid gap-6">
        <RegisterForm />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or</span>
          </div>
        </div>
        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Already have an account? Sign in{' '}
            <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
