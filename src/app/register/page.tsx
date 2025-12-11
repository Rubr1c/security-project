'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import * as v from 'valibot';
import Link from 'next/link';

type RegisterFormData = v.InferInput<typeof createUserSchema>;

export default function RegisterPage() {
  const { registerMutation } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: valibotResolver(createUserSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600">
            <span className="text-xl font-bold text-white">HC</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Create an account
          </h1>
          <p className="mt-1 text-slate-500">
            Sign up to book appointments and manage your health
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              {...register('name')}
              id="name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
            />

            <Input
              {...register('email')}
              type="email"
              id="email"
              label="Email"
              placeholder="you@example.com"
              error={errors.email?.message}
            />

            <Input
              {...register('password')}
              type="password"
              id="password"
              label="Password"
              placeholder="Create a password"
              error={errors.password?.message}
            />

            <Button
              type="submit"
              isLoading={registerMutation.isPending}
              className="w-full"
            >
              Create Account
            </Button>

            {registerMutation.isError && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : 'Registration failed'}
              </div>
            )}

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

