import { apiClient } from './client';
import * as v from 'valibot';
import {
  loginSchema,
  createUserSchema,
  changePasswordSchema,
} from '@/lib/validation/user-schemas';

type LoginInput = v.InferInput<typeof loginSchema>;
type RegisterInput = v.InferInput<typeof createUserSchema>;
type ChangePasswordInput = v.InferInput<typeof changePasswordSchema>;

export const auth = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post<{ token: string }>(
      '/auth/login',
      data
    );
    return response.data;
  },
  register: async (data: RegisterInput) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  changePassword: async (data: ChangePasswordInput) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
  me: async (token?: string) => {
    if (token) {
      const response = await apiClient.get('/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    }
    const response = await apiClient.get('/me');
    return response.data;
  },
};
