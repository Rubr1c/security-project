import { apiClient } from './client';
import * as v from 'valibot';
import {
  loginSchema,
  createUserSchema,
} from '@/lib/validation/user-schemas';

type LoginInput = v.InferInput<typeof loginSchema>;
type RegisterInput = v.InferInput<typeof createUserSchema>;

const otpVerifySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

const otpResendSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

type OtpVerifyInput = v.InferInput<typeof otpVerifySchema>;
type OtpResendInput = v.InferInput<typeof otpResendSchema>;

export type LoginResponse =
  | { otpRequired: true; email: string }
  | { token: string };

export type RegisterResponse =
  | { otpRequired: true; email: string }
  | { message: string };

const changePasswordRequestSchema = v.object({
  oldPassword: v.pipe(v.string(), v.minLength(1, 'Old password is required')),
  newPassword: v.pipe(v.string(), v.minLength(1, 'New password is required')),
});

const changePasswordVerifySchema = v.object({
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

type ChangePasswordRequestInput = v.InferInput<typeof changePasswordRequestSchema>;
type ChangePasswordVerifyInput = v.InferInput<typeof changePasswordVerifySchema>;

export type ChangePasswordResponse =
  | { otpRequired: true; email: string }
  | { message: string };

export const auth = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterInput) => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },
  changePasswordRequest: async (data: ChangePasswordRequestInput) => {
    const response = await apiClient.put<ChangePasswordResponse>(
      '/auth/change-password',
      v.parse(changePasswordRequestSchema, data)
    );
    return response.data;
  },
  changePasswordVerify: async (data: ChangePasswordVerifyInput) => {
    const response = await apiClient.put<{ message: string }>(
      '/auth/change-password',
      v.parse(changePasswordVerifySchema, data)
    );
    return response.data;
  },
  verifyOtp: async (data: OtpVerifyInput) => {
    const response = await apiClient.post<{ token: string }>(
      '/auth/verify-otp',
      v.parse(otpVerifySchema, data)
    );
    return response.data;
  },
  resendOtp: async (data: OtpResendInput) => {
    const response = await apiClient.post<{ message: string }>(
      '/auth/resend-otp',
      v.parse(otpResendSchema, data)
    );
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
