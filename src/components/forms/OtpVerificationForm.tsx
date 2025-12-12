'use client';

import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface FormData {
  code: string;
}

export function OtpVerificationForm({ email }: { email: string }) {
  const { verifyOtpMutation, resendOtpMutation } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { code: '' },
  });

  const onSubmit = (data: FormData) => {
    verifyOtpMutation.mutate({ email, code: data.code });
  };

  return (
    <div className="grid gap-6">
      <div className="border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
          Code sent to
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-950 break-words">
          {email}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Enter the 6-digit code. It expires in 10 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <Input
          {...register('code', {
            required: 'Enter the 6-digit code',
            pattern: {
              value: /^\d{6}$/,
              message: 'Code must be exactly 6 digits',
            },
            setValueAs: (v) =>
              typeof v === 'string' ? v.replaceAll(/\D/g, '').slice(0, 6) : '',
          })}
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          label="Verification code"
          placeholder="123456"
          error={errors.code?.message}
        />

        <div className="flex items-center justify-between gap-6">
          <p className="text-sm text-slate-700">Didn&apos;t receive a code?</p>
          <button
            type="button"
            onClick={() => resendOtpMutation.mutate({ email })}
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            disabled={resendOtpMutation.isPending}
          >
            Resend code
          </button>
        </div>

        {verifyOtpMutation.isError && (
          <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
            {verifyOtpMutation.error instanceof Error
              ? verifyOtpMutation.error.message
              : 'Verification failed'}
          </div>
        )}

        {resendOtpMutation.isError && (
          <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
            {resendOtpMutation.error instanceof Error
              ? resendOtpMutation.error.message
              : 'Failed to resend code'}
          </div>
        )}

        {resendOtpMutation.isSuccess && (
          <div className="border border-teal-200 bg-teal-50 p-3 text-sm font-medium text-teal-800">
            Code sent.
          </div>
        )}

        <Button type="submit" isLoading={verifyOtpMutation.isPending}>
          Verify
        </Button>
      </form>
    </div>
  );
}


