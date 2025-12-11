'use client';

import { useForm } from 'react-hook-form';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { Button, Input, Select } from '@/components/ui';

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
    const dateObj = new Date(data.date);
    const isoDate = dateObj.toISOString().slice(0, 19);

    createAppointmentMutation.mutate(
      { doctorId: data.doctorId, date: isoDate },
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
      <Select
        {...register('doctorId', {
          valueAsNumber: true,
          required: 'Please select a doctor',
        })}
        id="doctorId"
        label="Select Doctor"
        error={errors.doctorId?.message}
        disabled={doctorsQuery.isPending}
      >
        <option value="">Choose a doctor...</option>
        {doctorsQuery.data?.map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.name}
          </option>
        ))}
      </Select>

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
        <p className="text-center text-sm text-red-600">
          {createAppointmentMutation.error instanceof Error
            ? createAppointmentMutation.error.message
            : 'Failed to book appointment'}
        </p>
      )}
    </form>
  );
}
