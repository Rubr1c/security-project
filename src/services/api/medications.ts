import { apiClient } from './client';
import * as v from 'valibot';
import { addMedicationSchema } from '@/lib/validation/medication-schemas';
import { Medication } from '@/lib/db/types';

type AddMedicationInput = v.InferInput<typeof addMedicationSchema>;

export const medications = {
  list: async () => {
    const response = await apiClient.get<Medication[]>('/medications');
    return response.data;
  },
  create: async (data: AddMedicationInput) => {
    const response = await apiClient.post<Medication>('/medications', data);
    return response.data;
  },
};

