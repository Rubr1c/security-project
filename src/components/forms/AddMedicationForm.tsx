'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { addMedicationSchema } from '@/lib/validation/medication-schemas';
import { useAppointments } from '@/hooks/useAppointments';
import { Button, Input, Textarea } from '@/components/ui';
import * as v from 'valibot';

type MedicationFormData = v.InferInput<typeof addMedicationSchema>;

interface AddMedicationFormProps {
  appointmentId: number;
  onSuccess?: () => void;
}

export function AddMedicationForm({
  appointmentId,
  onSuccess,
}: AddMedicationFormProps) {
  const { addMedicationMutation } = useAppointments();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationFormData>({
    resolver: valibotResolver(addMedicationSchema),
  });

  const onSubmit = (data: MedicationFormData) => {
    addMedicationMutation.mutate(
      { id: appointmentId, data },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('name')}
        id="name"
        label="Medication Name"
        placeholder="e.g., Amoxicillin"
        error={errors.name?.message}
      />

      <Input
        {...register('dosage')}
        id="dosage"
        label="Dosage"
        placeholder="e.g., 500mg twice daily"
        error={errors.dosage?.message}
      />

      <Textarea
        {...register('instructions')}
        id="instructions"
        label="Instructions"
        placeholder="e.g., Take with food. Complete full course."
        rows={3}
        error={errors.instructions?.message}
      />

      <Button
        type="submit"
        isLoading={addMedicationMutation.isPending}
        className="w-full"
      >
        Add Medication
      </Button>

      {addMedicationMutation.isError && (
        <p className="text-center text-sm text-red-600">
          {addMedicationMutation.error instanceof Error
            ? addMedicationMutation.error.message
            : 'Failed to add medication'}
        </p>
      )}
    </form>
  );
}
