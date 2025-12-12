'use client';

import { useForm } from 'react-hook-form';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { Button, Input, Select } from '@/components/ui';
import { useToast } from '@/components/providers/ToastProvider';

interface FormData {
  doctorId: number;
  date: string;
  time: string;
}

interface BookAppointmentFormProps {
  onSuccess?: () => void;
}

export function BookAppointmentForm({ onSuccess }: BookAppointmentFormProps) {
  const { createAppointmentMutation } = useAppointments();
  const { doctorsQuery } = useUsers();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}`;
  });

  const onSubmit = (data: FormData) => {
    const combined = `${data.date}T${data.time}`;
    const dateObj = new Date(combined);
    const isoDate = dateObj.toISOString().slice(0, 19);

    createAppointmentMutation.mutate(
      { doctorId: data.doctorId, date: isoDate },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
          toast.success('Appointment requested', 'Your request was submitted.');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <Select
        {...register('doctorId', {
          valueAsNumber: true,
          required: 'Please select a doctor',
        })}
        id="doctorId"
        label="Doctor"
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

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          {...register('date', { required: 'Please select a date' })}
          id="date"
          type="date"
          label="Date"
          error={errors.date?.message}
        />

        <Select
          {...register('time', { required: 'Please select a time' })}
          id="time"
          label="Time"
          error={errors.time?.message}
        >
          <option value="">Choose a time…</option>
          {timeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      {createAppointmentMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {createAppointmentMutation.error instanceof Error
            ? createAppointmentMutation.error.message
            : 'Failed to book appointment'}
        </div>
      )}

      <Button type="submit" isLoading={createAppointmentMutation.isPending}>
        Book appointment
      </Button>
    </form>
  );
}
