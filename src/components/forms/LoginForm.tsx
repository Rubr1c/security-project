'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { loginSchema } from '@/lib/validation/user-schemas';
import { useAuth } from '@/hooks/useAuth';
import { Input, Button } from '@/components/ui';
import * as v from 'valibot';

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
        id="email"
        type="email"
        label="Email Address"
        placeholder="you@example.com"
        error={errors.email?.message}
      />

      <Input
        {...register('password')}
        id="password"
        type="password"
        label="Password"
        placeholder="••••••••"
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
        <p className="text-center text-sm text-red-400">
          {loginMutation.error instanceof Error
            ? loginMutation.error.message
            : 'Login failed. Please check your credentials.'}
        </p>
      )}
    </form>
  );
}
