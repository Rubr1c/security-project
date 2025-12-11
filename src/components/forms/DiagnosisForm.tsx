'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { updateDiagnosisSchema } from '@/lib/validation/appointment-schemas';
import { useAppointments } from '@/hooks/useAppointments';
import { Button, Textarea } from '@/components/ui';
import * as v from 'valibot';

type DiagnosisFormData = v.InferInput<typeof updateDiagnosisSchema>;

interface DiagnosisFormProps {
  appointmentId: number;
  currentDiagnosis?: string | null;
  onSuccess?: () => void;
}

export function DiagnosisForm({
  appointmentId,
  currentDiagnosis,
  onSuccess,
}: DiagnosisFormProps) {
  const { updateDiagnosisMutation } = useAppointments();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiagnosisFormData>({
    resolver: valibotResolver(updateDiagnosisSchema),
    defaultValues: {
      diagnosis: currentDiagnosis ?? '',
    },
  });

  const onSubmit = (data: DiagnosisFormData) => {
    updateDiagnosisMutation.mutate(
      { id: appointmentId, data },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textarea
        {...register('diagnosis')}
        id="diagnosis"
        label="Diagnosis"
        placeholder="Enter diagnosis details..."
        rows={5}
        error={errors.diagnosis?.message}
      />

      <Button
        type="submit"
        isLoading={updateDiagnosisMutation.isPending}
        className="w-full"
      >
        {currentDiagnosis ? 'Update Diagnosis' : 'Add Diagnosis'}
      </Button>

      {updateDiagnosisMutation.isError && (
        <p className="text-center text-sm text-red-400">
          {updateDiagnosisMutation.error instanceof Error
            ? updateDiagnosisMutation.error.message
            : 'Failed to update diagnosis'}
        </p>
      )}
    </form>
  );
}

