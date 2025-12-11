import { apiClient } from './client';
import * as v from 'valibot';
import {
  createAppointmentSchema,
  updateDiagnosisSchema,
  appointmentResponseSchema,
} from '@/lib/validation/appointment-schemas';
import { addMedicationSchema } from '@/lib/validation/medication-schemas';
import { Appointment, Medication } from '@/lib/db/types';

type CreateAppointmentInput = v.InferInput<typeof createAppointmentSchema>;
type UpdateDiagnosisInput = v.InferInput<typeof updateDiagnosisSchema>;
type AppointmentResponseInput = v.InferInput<typeof appointmentResponseSchema>;
type AddMedicationInput = v.InferInput<typeof addMedicationSchema>;

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
    const response = await apiClient.post<Appointment>(
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
  delete: async (id: number) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },
};
