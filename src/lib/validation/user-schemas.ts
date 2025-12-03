import * as v from 'valibot';

//TODO: Remove admin role later
export const roleEnum = v.picklist(['nurse', 'patient', 'admin', 'doctor']);

const passwordSchema = v.pipe(
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

// Appointment schemas
export const appointmentStatusEnum = v.picklist([
  'pending',
  'confirmed',
  'denied',
  'completed',
]);

// Doctor response to appointment request (accept/deny)
export const appointmentResponseSchema = v.object({
  action: v.picklist(['confirm', 'deny']),
});

export const createAppointmentSchema = v.object({
  doctorId: v.pipe(v.number(), v.integer(), v.minValue(1, 'Invalid doctor ID')),
  date: v.pipe(
    v.string(),
    v.isoDateTime('Date must be a valid ISO date-time string')
  ),
});

export const updateDiagnosisSchema = v.object({
  diagnosis: v.pipe(
    v.string(),
    v.minLength(1, 'Diagnosis cannot be empty'),
    v.maxLength(5000, 'Diagnosis must be less than 5000 characters')
  ),
});

// Medication schema
export const addMedicationSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, 'Medication name is required'),
    v.maxLength(200, 'Medication name must be less than 200 characters')
  ),
  dosage: v.pipe(
    v.string(),
    v.minLength(1, 'Dosage is required'),
    v.maxLength(100, 'Dosage must be less than 100 characters')
  ),
  instructions: v.pipe(
    v.string(),
    v.minLength(1, 'Instructions are required'),
    v.maxLength(1000, 'Instructions must be less than 1000 characters')
  ),
});

// Password change schema
export const changePasswordSchema = v.object({
  oldPassword: v.pipe(v.string(), v.minLength(1, 'Old password is required')),
  newPassword: passwordSchema,
});
