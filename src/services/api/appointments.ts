import { apiClient } from './client';
import {
  CreateAppointmentInput,
  UpdateDiagnosisInput,
  AppointmentResponseInput,
} from '@/lib/validation/appointment-schemas';
import { AddMedicationInput } from '@/lib/validation/medication-schemas';
import { Appointment, Medication } from '@/lib/db/types';

export const appointments = {
  list: async () => {
    const response = await apiClient.get<Appointment[]>('/appointments');
    return response.data;
  },
  get: async (id: number) => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },
  create: async (data: CreateAppointmentInput) => {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  },
  updateDiagnosis: async (id: number, data: UpdateDiagnosisInput) => {
    const response = await apiClient.put(`/appointments/${id}/diagnosis`, data);
    return response.data;
  },
  respond: async (id: number, data: AppointmentResponseInput) => {
    const response = await apiClient.put<Appointment>(
      `/appointments/${id}/respond`,
      data
    );
    return response.data;
  },
  getMedications: async (id: number) => {
    const response = await apiClient.get<Medication[]>(
      `/appointments/${id}/medications`
    );
    return response.data;
  },
  addMedication: async (id: number, data: AddMedicationInput) => {
    const response = await apiClient.post<{ medicationId: number }>(
      `/appointments/${id}/medications`,
      data
    );
    return response.data;
  },
};
