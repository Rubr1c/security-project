import * as v from 'valibot';

export const otpVerifySchema = v.object({
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

export const otpResendSchema = v.object({
  email: v.pipe(v.string(), v.email()),
});

export const changePasswordRequestSchema = v.object({
  oldPassword: v.pipe(v.string(), v.minLength(1, 'Old password is required')),
  newPassword: v.pipe(v.string(), v.minLength(1, 'New password is required')),
});

export const changePasswordVerifySchema = v.object({
  code: v.pipe(v.string(), v.regex(/^\d{6}$/, 'Code must be 6 digits')),
});

export type OtpVerifyInput = v.InferInput<typeof otpVerifySchema>;
export type OtpResendInput = v.InferInput<typeof otpResendSchema>;
export type ChangePasswordRequestInput = v.InferInput<typeof changePasswordRequestSchema>;
export type ChangePasswordVerifyInput = v.InferInput<typeof changePasswordVerifySchema>;
