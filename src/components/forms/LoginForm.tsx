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
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: valibotResolver(loginSchema),
  });

  const emailValue = watch('email');

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-3">
        <Input
          {...register('email')}
          type="email"
          id="email"
          label="Email"
          placeholder="you@example.com"
          error={errors.email?.message}
          autoComplete="email"
        />

        <Input
          {...register('password')}
          type="password"
          id="password"
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href={`/auth/forgot-password${
              emailValue ? `?email=${encodeURIComponent(emailValue)}` : ''
            }`}
            className="text-sm font-medium text-teal-600 hover:text-teal-500"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {loginMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {loginMutation.error instanceof Error
            ? loginMutation.error.message
            : 'Login failed'}
        </div>
      )}

      <Button type="submit" isLoading={loginMutation.isPending}>
        Sign in
      </Button>
    </form>
  );
}
