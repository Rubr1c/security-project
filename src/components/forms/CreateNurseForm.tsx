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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register('name')}
        id="name"
        type="text"
        label="Full Name"
        placeholder="Jane Doe"
        error={errors.name?.message}
      />

      <Input
        {...register('email')}
        id="email"
        type="email"
        label="Email Address"
        placeholder="nurse@hospital.com"
        error={errors.email?.message}
      />

      <Input
        {...register('password')}
        id="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        error={errors.password?.message}
      />

      <Button
        type="submit"
        isLoading={createNurseMutation.isPending}
        className="w-full"
      >
        Create Nurse
      </Button>

      {createNurseMutation.isError && (
        <p className="text-center text-sm text-red-400">
          {createNurseMutation.error instanceof Error
            ? createNurseMutation.error.message
            : 'Failed to create nurse'}
        </p>
      )}

      {createNurseMutation.isSuccess && (
        <p className="text-center text-sm text-emerald-400">
          Nurse created successfully
        </p>
      )}
    </form>
  );
}

