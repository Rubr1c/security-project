import * as v from 'valibot';

//TODO: Remove admin role later
export const roleEnum = v.picklist(['nurse', 'patient', 'admin', 'doctor']);

export const createUserSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(
    v.string(),
    v.minLength(3, 'Name must be at least 3 characters')
  ),
  password: v.pipe(
    v.string(),
    v.minLength(8, 'Password must be at least 8 characters'),
    v.regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    )
  ),
  // role: roleEnum,
});

export const updateUserSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email())),
  password: v.optional(
    v.pipe(
      v.string(),
      v.minLength(8, 'Password must be at least 8 characters'),
      v.regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      )
    )
  ),
  role: v.optional(roleEnum),
});

export const loginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(
    v.string(),
    v.minLength(8, 'Password must be at least 8 characters'),
    v.regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    )
  ),
});

export const deleteUserSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
});
