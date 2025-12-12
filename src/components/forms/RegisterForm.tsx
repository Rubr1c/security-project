'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import * as v from 'valibot';

type RegisterFormData = v.InferInput<typeof createUserSchema>;

export function RegisterForm() {
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-3">
        <Input
          {...register('name')}
          id="name"
          type="text"
          label="Name"
          placeholder="John Doe"
          error={errors.name?.message}
          autoComplete="name"
        />

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
          placeholder="At least 8 characters"
          error={errors.password?.message}
          autoComplete="new-password"
        />
      </div>

      {registerMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {registerMutation.error instanceof Error
            ? registerMutation.error.message
            : 'Registration failed'}
        </div>
      )}

      <Button type="submit" isLoading={registerMutation.isPending}>
        Create account
      </Button>
    </form>
  );
}


