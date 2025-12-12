'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { updateDiagnosisSchema } from '@/lib/validation/appointment-schemas';
import { useAppointments } from '@/hooks/useAppointments';
import { Button, Textarea } from '@/components/ui';
import * as v from 'valibot';
import { useToast } from '@/components/providers/ToastProvider';

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
  const toast = useToast();

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
          toast.success('Diagnosis saved', `Appointment #${appointmentId} updated.`);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <Textarea
        {...register('diagnosis')}
        id="diagnosis"
        label="Diagnosis"
        placeholder="Write the diagnosis..."
        rows={5}
        error={errors.diagnosis?.message}
      />

      {updateDiagnosisMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {updateDiagnosisMutation.error instanceof Error
            ? updateDiagnosisMutation.error.message
            : 'Failed to update diagnosis'}
        </div>
      )}

      <Button type="submit" isLoading={updateDiagnosisMutation.isPending}>
        {currentDiagnosis ? 'Update diagnosis' : 'Add diagnosis'}
      </Button>
    </form>
  );
}
