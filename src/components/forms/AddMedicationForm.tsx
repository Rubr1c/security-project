'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { addMedicationSchema } from '@/lib/validation/medication-schemas';
import { useAppointments } from '@/hooks/useAppointments';
import { Button, Input, Textarea } from '@/components/ui';
import * as v from 'valibot';
import { useToast } from '@/components/providers/ToastProvider';

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
  const toast = useToast();

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
          toast.success(
            'Medication added',
            `Linked to appointment #${appointmentId}.`
          );
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <Input
        {...register('name')}
        id="name"
        label="Medication"
        placeholder="Amoxicillin"
        error={errors.name?.message}
      />

      <Input
        {...register('dosage')}
        id="dosage"
        label="Dosage"
        placeholder="500mg twice daily"
        error={errors.dosage?.message}
      />

      <Textarea
        {...register('instructions')}
        id="instructions"
        label="Instructions"
        placeholder="Take with food..."
        rows={3}
        error={errors.instructions?.message}
      />

      {addMedicationMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {addMedicationMutation.error instanceof Error
            ? addMedicationMutation.error.message
            : 'Failed to add medication'}
        </div>
      )}

      <Button type="submit" isLoading={addMedicationMutation.isPending}>
        Add medication
      </Button>
    </form>
  );
}
