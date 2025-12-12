'use client';

import { useUsers } from '@/hooks/useUsers';
import { Button, Select } from '@/components/ui';
import { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';

interface NurseAssignmentFormProps {
  onSuccess?: () => void;
}

export function NurseAssignmentForm({ onSuccess }: NurseAssignmentFormProps) {
  const { nursesQuery, assignNurseMutation } = useUsers();
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const toast = useToast();

  const availableNurses =
    nursesQuery.data?.filter((nurse) => nurse.doctorId === null) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNurseId) return;

    assignNurseMutation.mutate(parseInt(selectedNurseId), {
      onSuccess: () => {
        setSelectedNurseId('');
        onSuccess?.();
        toast.success('Nurse assigned', 'The nurse is now assigned to you.');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Select
        label="Nurse"
        value={selectedNurseId}
        onChange={(e) => setSelectedNurseId(e.target.value)}
        disabled={nursesQuery.isPending}
      >
        <option value="">Choose a nurse...</option>
        {availableNurses.map((nurse) => (
          <option key={nurse.id} value={nurse.id}>
            {nurse.name} ({nurse.email})
          </option>
        ))}
      </Select>

      {availableNurses.length === 0 && !nursesQuery.isPending && (
        <div className="border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          No available nurses. All nurses are already assigned.
        </div>
      )}

      {assignNurseMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {assignNurseMutation.error instanceof Error
            ? assignNurseMutation.error.message
            : 'Failed to assign nurse'}
        </div>
      )}

      <Button
        type="submit"
        isLoading={assignNurseMutation.isPending}
        disabled={!selectedNurseId || assignNurseMutation.isPending}
      >
        Assign nurse
      </Button>
    </form>
  );
}
