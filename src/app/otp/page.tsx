import Link from 'next/link';
import { redirect } from 'next/navigation';
import { OtpVerificationForm } from '@/components/forms/OtpVerificationForm';
import { AuthLayout } from '@/components/layout/AuthLayout';

type OtpSearchParams = Record<string, string | string[] | undefined>;

export default async function OtpPage(
  props: {
    searchParams?: OtpSearchParams | Promise<OtpSearchParams>;
  } = {}
) {
  const resolvedSearchParams = await Promise.resolve(props.searchParams ?? {});
  const rawEmail = resolvedSearchParams.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  if (!email) {
    redirect('/login');
  }

  return (
    <AuthLayout title="Check your email" subtitle="">
      <div className="grid gap-6">
        <OtpVerificationForm email={email} />
        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Use a different email
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
