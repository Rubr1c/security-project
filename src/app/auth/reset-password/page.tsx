import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your new password below"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
