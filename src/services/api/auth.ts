import { apiClient } from './client';
import * as v from 'valibot';
import { LoginInput, RegisterInput } from '@/lib/validation/user-schemas';
import {
  otpVerifySchema,
  otpResendSchema,
  changePasswordRequestSchema,
  changePasswordVerifySchema,
  OtpVerifyInput,
  OtpResendInput,
  ChangePasswordRequestInput,
  ChangePasswordVerifyInput,
} from '@/lib/validation/auth-schemas';

export interface OtpRequiredResponse {
  otpRequired: true;
  email: string;
}

export type LoginResponse = OtpRequiredResponse;

export type RegisterResponse = OtpRequiredResponse | { message: string };

export interface OtpVerifyResponse {
  success: true;
}

export type ChangePasswordResponse =
  | { otpRequired: true; email: string }
  | { message: string };

export const auth = {
  login: async (data: LoginInput) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterInput) => {
    const response = await apiClient.post<RegisterResponse>(
      '/auth/register',
      data
    );
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
    const response = await apiClient.post<OtpVerifyResponse>(
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
  logout: async () => {
    const response = await apiClient.post<{ success: true }>('/auth/logout');
    return response.data;
  },
  me: async () => {
    const response = await apiClient.get('/me');
    return response.data;
  },
};
