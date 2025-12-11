'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { loginSchema } from '@/lib/validation/user-schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import * as v from 'valibot';
import Link from 'next/link';

type LoginFormData = v.InferInput<typeof loginSchema>;

export function LoginForm() {
  const { loginMutation } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: valibotResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        placeholder="Enter your password"
        error={errors.password?.message}
      />

      <Button
        type="submit"
        isLoading={loginMutation.isPending}
        className="w-full"
      >
        Sign In
      </Button>

      {loginMutation.isError && (
        <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
          {loginMutation.error instanceof Error
            ? loginMutation.error.message
            : 'Login failed'}
        </div>
      )}

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
