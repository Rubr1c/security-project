'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/v1/me/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medical-records.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(error);
      alert('Failed to download records.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/v1/me', { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');

      window.location.href = '/';
    } catch (error) {
      console.error(error);
      alert('Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin', 'doctor', 'nurse', 'patient']}>
      <div className="grid gap-9">
        <div className="border-l-4 border-teal-600 pl-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Security & Privacy
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Manage your account security and privacy preferences.
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Signed in as
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {user?.email ?? '—'}
          </p>
        </div>

        <div className="border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Change password
          </p>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>

        {/* Data Privacy & Compliance Card */}
        <div className="border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Data Privacy & Compliance
          </p>
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Right to Portability
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Download a complete copy of your personal data, appointments,
                  and medications in JSON format.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleExport}
                isLoading={isExporting}
                className="shrink-0"
              >
                Download Medical Records
              </Button>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Right to Erasure
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Permanently delete your account. This action will anonymize
                  your data and revoke access.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Deletion"
      >
        <div className="space-y-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Critical Warning
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Are you sure you want to delete your account? This action is{' '}
                    <strong>irreversible</strong>.
                  </p>
                  <ul role="list" className="mt-2 list-disc space-y-1 pl-5">
                    <li>
                      Your personal information will be permanently anonymized.
                    </li>
                    <li>
                      You will lose access to all medical records immediately.
                    </li>
                    <li>Future logins will be disabled.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="w-full justify-center"
            >
              Requirements Met: Yes, Delete My Account
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="w-full justify-center"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
