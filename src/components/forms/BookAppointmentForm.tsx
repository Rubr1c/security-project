'use client';

import { useForm } from 'react-hook-form';
import { createAppointmentSchema } from '@/lib/validation/appointment-schemas';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { Button, Input, Select } from '@/components/ui';
import * as v from 'valibot';

type BookAppointmentFormData = v.InferInput<typeof createAppointmentSchema>;

interface FormData {
  doctorId: number;
  date: string;
}

interface BookAppointmentFormProps {
  onSuccess?: () => void;
}

export function BookAppointmentForm({ onSuccess }: BookAppointmentFormProps) {
  const { createAppointmentMutation } = useAppointments();
  const { doctorsQuery } = useUsers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    const isoDate = new Date(data.date).toISOString();
    const validatedData = v.parse(createAppointmentSchema, {
      doctorId: data.doctorId,
      date: isoDate,
    }) satisfies BookAppointmentFormData;

    createAppointmentMutation.mutate(validatedData, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  const doctorOptions =
    doctorsQuery.data?.map((doctor) => ({
      value: doctor.id,
      label: doctor.name,
    })) ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        {...register('doctorId', {
          valueAsNumber: true,
          required: 'Please select a doctor',
        })}
        id="doctorId"
        label="Select Doctor"
        options={doctorOptions}
        placeholder="Choose a doctor"
        error={errors.doctorId?.message}
        disabled={doctorsQuery.isPending}
      />

      <Input
        {...register('date', { required: 'Please select a date and time' })}
        id="date"
        type="datetime-local"
        label="Appointment Date & Time"
        error={errors.date?.message}
      />

      <Button
        type="submit"
        isLoading={createAppointmentMutation.isPending}
        className="w-full"
      >
        Book Appointment
      </Button>

      {createAppointmentMutation.isError && (
        <p className="text-center text-sm text-red-400">
          {createAppointmentMutation.error instanceof Error
            ? createAppointmentMutation.error.message
            : 'Failed to book appointment'}
        </p>
      )}
    </form>
  );
}
