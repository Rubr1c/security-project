'use client';

import { useUsers } from '@/hooks/useUsers';
import { Button, Select } from '@/components/ui';
import { useState } from 'react';

interface NurseAssignmentFormProps {
  onSuccess?: () => void;
}

export function NurseAssignmentForm({ onSuccess }: NurseAssignmentFormProps) {
  const { nursesQuery, assignNurseMutation } = useUsers();
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');

  const availableNurses =
    nursesQuery.data?.filter((nurse) => nurse.doctorId === null) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNurseId) return;

    assignNurseMutation.mutate(parseInt(selectedNurseId), {
      onSuccess: () => {
        setSelectedNurseId('');
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Select Nurse"
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
        <p className="text-sm text-slate-500">
          No available nurses. All nurses are already assigned.
        </p>
      )}

      <Button
        type="submit"
        isLoading={assignNurseMutation.isPending}
        disabled={!selectedNurseId || assignNurseMutation.isPending}
        className="w-full"
      >
        Assign Nurse
      </Button>

      {assignNurseMutation.isError && (
        <p className="text-center text-sm text-red-600">
          {assignNurseMutation.error instanceof Error
            ? assignNurseMutation.error.message
            : 'Failed to assign nurse'}
        </p>
      )}
    </form>
  );
}
