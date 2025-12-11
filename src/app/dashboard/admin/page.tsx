'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LogTable } from '@/components/tables/LogTable';
import { UserTable } from '@/components/tables/UserTable';
import { CreateDoctorForm } from '@/components/forms/CreateDoctorForm';
import { CreateNurseForm } from '@/components/forms/CreateNurseForm';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Modal,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { useLogs } from '@/hooks/useLogs';
import { useUsers } from '@/hooks/useUsers';
import { apiClient } from '@/services/api/client';

type Tab = 'logs' | 'doctors' | 'nurses';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [createDoctorModalOpen, setCreateDoctorModalOpen] = useState(false);
  const [createNurseModalOpen, setCreateNurseModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { logsQuery } = useLogs();
  const { doctorsQuery, nursesQuery } = useUsers();

  const deleteDoctorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/doctors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'doctors'] });
    },
  });

  const deleteNurseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/nurses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'nurses'] });
    },
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'logs', label: 'System Logs', count: logsQuery.data?.length },
    { id: 'doctors', label: 'Doctors', count: doctorsQuery.data?.length },
    { id: 'nurses', label: 'Nurses', count: nursesQuery.data?.length },
  ];

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-slate-400">System management and user administration</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {logsQuery.data?.length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Total Logs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {doctorsQuery.data?.length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Doctors</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <span className="text-2xl">👩‍⚕️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {nursesQuery.data?.length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Nurses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {logsQuery.data?.filter((l) => l.level === 'error').length ?? 0}
                </p>
                <p className="text-sm text-slate-400">Errors</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-lg bg-slate-800/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                        activeTab === tab.id
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'doctors' && (
              <Button onClick={() => setCreateDoctorModalOpen(true)}>
                Add Doctor
              </Button>
            )}
            {activeTab === 'nurses' && (
              <Button onClick={() => setCreateNurseModalOpen(true)}>Add Nurse</Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'logs' && (
              <>
                {logsQuery.isPending ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : logsQuery.isError ? (
                  <div className="py-12 text-center text-red-400">
                    Failed to load logs
                  </div>
                ) : logsQuery.data?.length === 0 ? (
                  <EmptyState
                    icon="📝"
                    title="No logs yet"
                    description="System logs will appear here"
                  />
                ) : (
                  <LogTable logs={logsQuery.data ?? []} />
                )}
              </>
            )}

            {activeTab === 'doctors' && (
              <>
                {doctorsQuery.isPending ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : doctorsQuery.isError ? (
                  <div className="py-12 text-center text-red-400">
                    Failed to load doctors
                  </div>
                ) : doctorsQuery.data?.length === 0 ? (
                  <EmptyState
                    icon="👨‍⚕️"
                    title="No doctors"
                    description="Add your first doctor to get started"
                  />
                ) : (
                  <UserTable
                    users={doctorsQuery.data ?? []}
                    onDelete={(id) => deleteDoctorMutation.mutate(id)}
                    isDeleting={deleteDoctorMutation.isPending}
                  />
                )}
              </>
            )}

            {activeTab === 'nurses' && (
              <>
                {nursesQuery.isPending ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : nursesQuery.isError ? (
                  <div className="py-12 text-center text-red-400">
                    Failed to load nurses
                  </div>
                ) : nursesQuery.data?.length === 0 ? (
                  <EmptyState
                    icon="👩‍⚕️"
                    title="No nurses"
                    description="Add your first nurse to get started"
                  />
                ) : (
                  <UserTable
                    users={nursesQuery.data ?? []}
                    onDelete={(id) => deleteNurseMutation.mutate(id)}
                    isDeleting={deleteNurseMutation.isPending}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={createDoctorModalOpen}
          onClose={() => setCreateDoctorModalOpen(false)}
          title="Add New Doctor"
        >
          <CreateDoctorForm onSuccess={() => setCreateDoctorModalOpen(false)} />
        </Modal>

        <Modal
          isOpen={createNurseModalOpen}
          onClose={() => setCreateNurseModalOpen(false)}
          title="Add New Nurse"
        >
          <CreateNurseForm onSuccess={() => setCreateNurseModalOpen(false)} />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

