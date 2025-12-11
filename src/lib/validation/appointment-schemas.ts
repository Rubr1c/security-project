import * as v from 'valibot';

export const appointmentStatusEnum = v.picklist([
  'pending',
  'confirmed',
  'denied',
  'completed',
]);

export const createAppointmentSchema = v.object({
  doctorId: v.pipe(v.number(), v.integer(), v.minValue(1, 'Invalid doctor ID')),
  date: v.pipe(
    v.string(),
    v.minLength(1, 'Date is required'),
    v.regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
      'Date must be a valid date-time string'
    )
  ),
});

export const appointmentResponseSchema = v.object({
  action: v.picklist(['confirm', 'deny']),
});

export const updateDiagnosisSchema = v.object({
  diagnosis: v.pipe(
    v.string(),
    v.minLength(1, 'Diagnosis cannot be empty'),
    v.maxLength(5000, 'Diagnosis must be less than 5000 characters')
  ),
});
