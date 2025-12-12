import { apiClient } from './client';
import { User } from '@/lib/db/types';

export const users = {
  listDoctors: async () => {
    const response = await apiClient.get<User[]>('/doctors');
    return response.data;
  },
  listNurses: async () => {
    const response = await apiClient.get<User[]>('/nurses');
    return response.data;
  },
  listPatients: async () => {
    const response = await apiClient.get<User[]>('/patients');
    return response.data;
  },
  getPatient: async (id: number) => {
    const response = await apiClient.get<User>(`/patients/${id}`);
    return response.data;
  },
  assignNurseToDoctor: async (nurseId: number) => {
    const response = await apiClient.put(`/nurses/${nurseId}/assign`);
    return response.data;
  },
  unassignNurseFromDoctor: async (nurseId: number) => {
    const response = await apiClient.delete(`/nurses/${nurseId}/assign`);
    return response.data;
  },
  getPatientMedications: async (id: number) => {
    const response = await apiClient.get(`/patients/${id}/medications`);
    return response.data;
  },
};
