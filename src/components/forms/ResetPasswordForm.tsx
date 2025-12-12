'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from '@/lib/validation/auth-schemas';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export function ResetPasswordForm() {
  const { resetPasswordMutation } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: valibotResolver(resetPasswordSchema),
    defaultValues: {
      token: token || '',
    },
  });

  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: (response) => {
        setSuccessMessage(response.message);
      },
    });
  };

  if (!token) {
     return (
        <div className="grid gap-6 text-center">
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                Invalid or missing token.
            </div>
            <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
                Request a new link
            </Link>
        </div>
     )
  }

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
      <input type="hidden" {...register('token')} />
      <div className="grid gap-3">
        <Input
          {...register('password')}
          type="password"
          id="password"
          label="New Password"
          placeholder="••••••••"
          error={errors.password?.message}
          autoComplete="new-password"
        />
      </div>

      {resetPasswordMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {resetPasswordMutation.error instanceof Error
            ? resetPasswordMutation.error.message
            : 'An error occurred'}
        </div>
      )}

      <Button type="submit" isLoading={resetPasswordMutation.isPending}>
        Reset Password
      </Button>
    </form>
  );
}
