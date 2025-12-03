import * as v from 'valibot';

export const assignPatientSchema = v.object({
  patientEmail: v.pipe(v.string(), v.email()),
});
