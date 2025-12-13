import * as v from 'valibot';
import { passwordSchema } from './user-schemas';

export const otpVerifySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

export const otpResendSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

export const changePasswordRequestSchema = v.object({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});

export const changePasswordVerifySchema = v.object({
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

export type OtpVerifyInput = v.InferInput<typeof otpVerifySchema>;
export type OtpResendInput = v.InferInput<typeof otpResendSchema>;
export type ChangePasswordRequestInput = v.InferInput<
  typeof changePasswordRequestSchema
>;
export type ChangePasswordVerifyInput = v.InferInput<
  typeof changePasswordVerifySchema
>;

export const forgotPasswordSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

export const resetPasswordSchema = v.object({
  token: v.string(),
  password: passwordSchema,
});

export type ForgotPasswordInput = v.InferInput<typeof forgotPasswordSchema>;
export type ResetPasswordInput = v.InferInput<typeof resetPasswordSchema>;
