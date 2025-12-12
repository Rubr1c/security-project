'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Button, Input } from '@/components/ui';
import * as v from 'valibot';
import type { User } from '@/lib/db/types';

type CreateDoctorFormData = v.InferInput<typeof createUserSchema>;

interface CreateDoctorFormProps {
  onSuccess?: () => void;
}

export function CreateDoctorForm({ onSuccess }: CreateDoctorFormProps) {
  const queryClient = useQueryClient();

  const createDoctorMutation = useMutation({
    mutationFn: async (data: CreateDoctorFormData) => {
      const response = await apiClient.post<User>('/doctors', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'doctors'] });
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDoctorFormData>({
    resolver: valibotResolver(createUserSchema),
  });

  const onSubmit = (data: CreateDoctorFormData) => {
    createDoctorMutation.mutate(data, {
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <Input
        {...register('name')}
        id="name"
        type="text"
        label="Name"
        placeholder="Dr. John Smith"
        error={errors.name?.message}
      />

      <Input
        {...register('email')}
        id="email"
        type="email"
        label="Email"
        placeholder="doctor@hospital.com"
        error={errors.email?.message}
      />

      <Input
        {...register('password')}
        id="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
      />

      {createDoctorMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {createDoctorMutation.error instanceof Error
            ? createDoctorMutation.error.message
            : 'Failed to create doctor'}
        </div>
      )}

      {createDoctorMutation.isSuccess && (
        <div className="border border-teal-200 bg-teal-50 p-3 text-sm font-medium text-teal-800">
          Doctor created successfully
        </div>
      )}

      <Button type="submit" isLoading={createDoctorMutation.isPending}>
        Create doctor
      </Button>
    </form>
  );
}
