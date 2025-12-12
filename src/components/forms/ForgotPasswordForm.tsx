'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  forgotPasswordSchema,
  ForgotPasswordInput,
} from '@/lib/validation/auth-schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { useState } from 'react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const { forgotPasswordMutation } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: valibotResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: (response) => {
        setSuccessMessage(response.message);
      },
    });
  };

  if (successMessage) {
    return (
      <div className="grid gap-6 text-center">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Return to login
        </Link>
      </div>
    );
  }

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
      </div>

      {forgotPasswordMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {forgotPasswordMutation.error instanceof Error
            ? forgotPasswordMutation.error.message
            : 'An error occurred'}
        </div>
      )}

      <Button type="submit" isLoading={forgotPasswordMutation.isPending}>
        Send Reset Link
      </Button>
    </form>
  );
}
