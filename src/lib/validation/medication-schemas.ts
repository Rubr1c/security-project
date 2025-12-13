import * as v from 'valibot';

export const addMedicationSchema = v.object({
  name: v.pipe(
    v.string(),
    v.transform((s) => s.trim()),
    v.minLength(1, 'Medication name is required'),
    v.maxLength(200, 'Medication name must be less than 200 characters')
  ),
  dosage: v.pipe(
    v.string(),
    v.transform((s) => s.trim()),
    v.minLength(1, 'Dosage is required'),
    v.maxLength(100, 'Dosage must be less than 100 characters')
  ),
  instructions: v.pipe(
    v.string(),
    v.transform((s) => s.trim()),
    v.minLength(1, 'Instructions are required'),
    v.maxLength(1000, 'Instructions must be less than 1000 characters')
  ),
});

export type AddMedicationInput = v.InferInput<typeof addMedicationSchema>;
