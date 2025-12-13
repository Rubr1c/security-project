'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LogTable } from '@/components/tables/LogTable';
import { UserTable } from '@/components/tables/UserTable';
import { CreateDoctorForm } from '@/components/forms/CreateDoctorForm';
import { CreateNurseForm } from '@/components/forms/CreateNurseForm';
import {
  Modal,
  EmptyState,
  LoadingSpinner,
  Button,
  Select,
} from '@/components/ui';
import { useLogs } from '@/hooks/useLogs';
import { useUsers } from '@/hooks/useUsers';
import { ApiError, apiClient } from '@/services/api/client';
import { useToast } from '@/components/providers/ToastProvider';
import { Plus } from 'lucide-react';

type View = 'logs' | 'doctors' | 'nurses';

export default function AdminDashboardPage() {
  const [view, setView] = useState<View>('logs');
  const [createDoctorModalOpen, setCreateDoctorModalOpen] = useState(false);
  const [createNurseModalOpen, setCreateNurseModalOpen] = useState(false);
  const [forceDeleteDoctorId, setForceDeleteDoctorId] = useState<number | null>(
    null
  );

  const queryClient = useQueryClient();
  const toast = useToast();
  const { logsQuery } = useLogs();
  const { doctorsQuery, nursesQuery } = useUsers();

  const forceDeleteDoctor = useMemo(() => {
    if (!forceDeleteDoctorId) return null;
    return doctorsQuery.data?.find((d) => d.id === forceDeleteDoctorId) ?? null;
  }, [forceDeleteDoctorId, doctorsQuery.data]);

  const deleteDoctorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/doctors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'doctors'] });
      toast.success('Doctor deleted', 'The doctor account was removed.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        return;
      }

      toast.error(
        'Could not delete doctor',
        err instanceof Error ? err.message : 'Delete failed'
      );
    },
  });

  const forceDeleteDoctorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/doctors/${id}?force=true`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'doctors'] });
      setForceDeleteDoctorId(null);
      toast.success(
        'Doctor deleted',
        'Doctor and associated appointments/medications were removed.'
      );
    },
    onError: (err) => {
      toast.error(
        'Could not delete doctor',
        err instanceof Error ? err.message : 'Delete failed'
      );
    },
  });

  const deleteNurseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/nurses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'nurses'] });
      toast.success('Nurse deleted', 'The nurse account was removed.');
    },
    onError: (err) => {
      toast.error(
        'Could not delete nurse',
        err instanceof Error ? err.message : 'Delete failed'
      );
    },
  });

  const allLogs = useMemo(() => {
    if (!logsQuery.data?.pages) return [];
    const allData = logsQuery.data.pages.flatMap((page) => page.data);
    const uniqueMap = new Map(allData.map((log) => [log.id, log]));
    return Array.from(uniqueMap.values());
  }, [logsQuery.data]);

  const totalLogs = logsQuery.data?.pages[0]?.total ?? 0;
  const totalErrors = allLogs.filter((l) => l.level === 'error').length;
  const totalDoctors = doctorsQuery.data?.length ?? 0;
  const totalNurses = nursesQuery.data?.length ?? 0;

  const handleDeleteDoctor = (id: number) => {
    deleteDoctorMutation.mutate(id, {
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          setForceDeleteDoctorId(id);
        }
      },
    });
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="grid gap-9">
        <div className="border-l-4 border-teal-600 pl-6">
          <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            Control center
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Review system activity and manage staff accounts.
          </p>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
            <div className="p-6">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Logs
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {totalLogs}
              </p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Errors
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {totalErrors}
              </p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Doctors
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {totalDoctors}
              </p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Nurses
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {totalNurses}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border border-slate-200 bg-white p-6 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-sm">
            <Select
              id="adminView"
              label="Workspace"
              value={view}
              onChange={(e) => setView(e.target.value as View)}
            >
              <option value="logs">System logs</option>
              <option value="doctors">Doctors</option>
              <option value="nurses">Nurses</option>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3">
            {view === 'doctors' && (
              <Button onClick={() => setCreateDoctorModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add doctor
              </Button>
            )}
            {view === 'nurses' && (
              <Button onClick={() => setCreateNurseModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add nurse
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {view === 'logs' && (
            <div className="grid gap-6">
              {logsQuery.isPending ? (
                <div className="grid place-items-center border border-slate-200 bg-white p-6">
                  <LoadingSpinner />
                </div>
              ) : logsQuery.isError ? (
                <div className="border border-red-300 bg-red-50 p-6 text-sm font-semibold text-red-800">
                  Failed to load logs
                </div>
              ) : allLogs.length === 0 ? (
                <EmptyState
                  title="No logs"
                  description="Nothing recorded yet."
                />
              ) : (
                <LogTable
                  logs={allLogs}
                  onLoadMore={() => logsQuery.fetchNextPage()}
                  hasMore={logsQuery.hasNextPage}
                  isLoadingMore={logsQuery.isFetchingNextPage}
                />
              )}
            </div>
          )}

          {view === 'doctors' && (
            <div className="grid gap-6">
              {doctorsQuery.isPending ? (
                <div className="grid place-items-center border border-slate-200 bg-white p-6">
                  <LoadingSpinner />
                </div>
              ) : doctorsQuery.isError ? (
                <div className="border border-red-300 bg-red-50 p-6 text-sm font-semibold text-red-800">
                  Failed to load doctors
                </div>
              ) : doctorsQuery.data?.length === 0 ? (
                <EmptyState
                  title="No doctors"
                  description="Create the first doctor account to begin."
                />
              ) : (
                <UserTable
                  users={doctorsQuery.data ?? []}
                  onDelete={handleDeleteDoctor}
                  isDeleting={
                    deleteDoctorMutation.isPending ||
                    forceDeleteDoctorMutation.isPending
                  }
                />
              )}
            </div>
          )}

          {view === 'nurses' && (
            <div className="grid gap-6">
              {nursesQuery.isPending ? (
                <div className="grid place-items-center border border-slate-200 bg-white p-6">
                  <LoadingSpinner />
                </div>
              ) : nursesQuery.isError ? (
                <div className="border border-red-300 bg-red-50 p-6 text-sm font-semibold text-red-800">
                  Failed to load nurses
                </div>
              ) : nursesQuery.data?.length === 0 ? (
                <EmptyState
                  title="No nurses"
                  description="Create the first nurse account to begin."
                />
              ) : (
                <UserTable
                  users={nursesQuery.data ?? []}
                  onDelete={(id) => deleteNurseMutation.mutate(id)}
                  isDeleting={deleteNurseMutation.isPending}
                />
              )}
            </div>
          )}
        </div>

        <Modal
          isOpen={createDoctorModalOpen}
          onClose={() => setCreateDoctorModalOpen(false)}
          title="Create doctor"
        >
          <CreateDoctorForm onSuccess={() => setCreateDoctorModalOpen(false)} />
        </Modal>

        <Modal
          isOpen={createNurseModalOpen}
          onClose={() => setCreateNurseModalOpen(false)}
          title="Create nurse"
        >
          <CreateNurseForm onSuccess={() => setCreateNurseModalOpen(false)} />
        </Modal>

        <Modal
          isOpen={forceDeleteDoctorId !== null}
          onClose={() => setForceDeleteDoctorId(null)}
          title="Delete doctor with appointments?"
        >
          <div className="grid gap-6">
            <div className="border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-950">
                This doctor has appointments.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                If you continue, we will delete the doctor and also delete all
                of their appointments and related medications.
              </p>
              {forceDeleteDoctor ? (
                <div className="mt-4 border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                    Doctor
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {forceDeleteDoctor.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {forceDeleteDoctor.email}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setForceDeleteDoctorId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={forceDeleteDoctorMutation.isPending}
                onClick={() => {
                  if (forceDeleteDoctorId) {
                    forceDeleteDoctorMutation.mutate(forceDeleteDoctorId);
                  }
                }}
              >
                Delete anyway
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
