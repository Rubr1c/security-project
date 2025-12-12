'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/providers/ToastProvider';

type Stage = 'request' | 'verify';

interface RequestFormData {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface VerifyFormData {
  code: string;
}

export function ChangePasswordForm() {
  const [stage, setStage] = useState<Stage>('request');
  const [emailForOtp, setEmailForOtp] = useState<string | null>(null);

  const toast = useToast();
  const {
    resendOtpMutation,
    changePasswordRequestMutation,
    changePasswordVerifyMutation,
  } = useAuth();
  const emailFromStore = useAuthStore((s) => s.user?.email) ?? '';

  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: requestErrors },
    reset: resetRequest,
    getValues,
  } = useForm<RequestFormData>({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
    reset: resetVerify,
  } = useForm<VerifyFormData>({ defaultValues: { code: '' } });

  const onRequest = (data: RequestFormData) => {
    if (data.newPassword !== data.confirmNewPassword) return;

    changePasswordRequestMutation.mutate(
      { oldPassword: data.oldPassword, newPassword: data.newPassword },
      {
        onSuccess: (res) => {
          if ('otpRequired' in res && res.otpRequired) {
            setEmailForOtp(res.email);
            setStage('verify');
          }
        },
      }
    );
  };

  const onVerify = (data: VerifyFormData) => {
    changePasswordVerifyMutation.mutate(
      { code: data.code },
      {
        onSuccess: () => {
          resetRequest();
          resetVerify();
          setStage('request');
          setEmailForOtp(null);
          toast.success('Password changed', 'Your password was updated.');
        },
      }
    );
  };

  const effectiveEmail = emailForOtp ?? emailFromStore;

  return (
    <div className="grid gap-6">
      {stage === 'request' ? (
        <form onSubmit={handleSubmitRequest(onRequest)} className="grid gap-6">
          <Input
            {...registerRequest('oldPassword', {
              required: 'Old password is required',
            })}
            id="oldPassword"
            type="password"
            label="Old password"
            placeholder="••••••••"
            error={requestErrors.oldPassword?.message}
            autoComplete="current-password"
          />

          <Input
            {...registerRequest('newPassword', {
              required: 'New password is required',
            })}
            id="newPassword"
            type="password"
            label="New password"
            placeholder="At least 8 characters"
            error={requestErrors.newPassword?.message}
            autoComplete="new-password"
          />

          <Input
            {...registerRequest('confirmNewPassword', {
              required: 'Confirm your new password',
              validate: (v) =>
                v === getValues('newPassword') || 'Passwords do not match',
            })}
            id="confirmNewPassword"
            type="password"
            label="Confirm new password"
            placeholder="Repeat new password"
            error={requestErrors.confirmNewPassword?.message}
            autoComplete="new-password"
          />

          {changePasswordRequestMutation.isError && (
            <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
              {changePasswordRequestMutation.error instanceof Error
                ? changePasswordRequestMutation.error.message
                : 'Failed to request code'}
            </div>
          )}

          <Button
            type="submit"
            isLoading={changePasswordRequestMutation.isPending}
          >
            Send verification code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmitVerify(onVerify)} className="grid gap-6">
          <div className="border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
              Code sent to
            </p>
            <p className="mt-2 text-sm font-semibold wrap-break-word text-slate-950">
              {effectiveEmail}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Enter the 6-digit code to confirm the password change.
            </p>
          </div>

          <Input
            {...registerVerify('code', {
              required: 'Enter the 6-digit code',
              pattern: {
                value: /^\d{6}$/,
                message: 'Code must be exactly 6 digits',
              },
              setValueAs: (v) =>
                typeof v === 'string'
                  ? v.replaceAll(/\D/g, '').slice(0, 6)
                  : '',
            })}
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            label="Verification code"
            placeholder="123456"
            error={verifyErrors.code?.message}
          />

          <div className="flex items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => {
                if (!effectiveEmail) return;
                resendOtpMutation.mutate({ email: effectiveEmail });
              }}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              disabled={resendOtpMutation.isPending || !effectiveEmail}
            >
              Resend code
            </button>

            <button
              type="button"
              onClick={() => {
                resetVerify();
                setStage('request');
              }}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              Start over
            </button>
          </div>

          {changePasswordVerifyMutation.isError && (
            <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
              {changePasswordVerifyMutation.error instanceof Error
                ? changePasswordVerifyMutation.error.message
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

          <Button
            type="submit"
            isLoading={changePasswordVerifyMutation.isPending}
          >
            Confirm password change
          </Button>
        </form>
      )}
    </div>
  );
}
