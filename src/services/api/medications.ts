import { apiClient } from './client';
import { Medication } from '@/lib/db/types';

export const medications = {
  list: async () => {
    const response = await apiClient.get<Medication[]>('/medications');
    return response.data;
  },
};

