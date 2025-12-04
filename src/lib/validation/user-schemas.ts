import * as v from 'valibot';

//TODO: Remove admin role later
export const roleEnum = v.picklist(['nurse', 'patient', 'admin', 'doctor']);

export const passwordSchema = v.pipe(
  v.string(),
  v.minLength(8, 'Password must be at least 8 characters'),
  v.regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  )
);

export const createUserSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(
    v.string(),
    v.minLength(3, 'Name must be at least 3 characters')
  ),
  password: passwordSchema,
  // role: roleEnum,
});

export const updateUserSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email())),
  password: v.optional(passwordSchema),
  role: v.optional(roleEnum),
});

export const loginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: passwordSchema,
});

export const deleteUserSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
});

export const changePasswordSchema = v.object({
  oldPassword: v.pipe(v.string(), v.minLength(1, 'Old password is required')),
  newPassword: passwordSchema,
});
