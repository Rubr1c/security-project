'use client';

import { useForm } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { createUserSchema } from '@/lib/validation/user-schemas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Button, Input } from '@/components/ui';
import * as v from 'valibot';
import type { User } from '@/lib/db/types';

type CreateNurseFormData = v.InferInput<typeof createUserSchema>;

interface CreateNurseFormProps {
  onSuccess?: () => void;
}

export function CreateNurseForm({ onSuccess }: CreateNurseFormProps) {
  const queryClient = useQueryClient();

  const createNurseMutation = useMutation({
    mutationFn: async (data: CreateNurseFormData) => {
      const response = await apiClient.post<User>('/nurses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'nurses'] });
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateNurseFormData>({
    resolver: valibotResolver(createUserSchema),
  });

  const onSubmit = (data: CreateNurseFormData) => {
    createNurseMutation.mutate(data, {
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
        placeholder="Jane Doe"
        error={errors.name?.message}
      />

      <Input
        {...register('email')}
        id="email"
        type="email"
        label="Email"
        placeholder="nurse@hospital.com"
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

      {createNurseMutation.isError && (
        <div className="border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {createNurseMutation.error instanceof Error
            ? createNurseMutation.error.message
            : 'Failed to create nurse'}
        </div>
      )}

      {createNurseMutation.isSuccess && (
        <div className="border border-teal-200 bg-teal-50 p-3 text-sm font-medium text-teal-800">
          Nurse created successfully
        </div>
      )}

      <Button type="submit" isLoading={createNurseMutation.isPending}>
        Create nurse
      </Button>
    </form>
  );
}
