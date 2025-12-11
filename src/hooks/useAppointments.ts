import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export const useAppointments = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const canFetchAppointments =
    user?.role === 'patient' ||
    user?.role === 'doctor' ||
    user?.role === 'nurse';

  const appointmentsQuery = useQuery({
    queryKey: ['appointments'],
    queryFn: api.appointments.list,
    enabled: !!token && hasHydrated && canFetchAppointments,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: api.appointments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const updateDiagnosisMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof api.appointments.updateDiagnosis>[1];
    }) => api.appointments.updateDiagnosis(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointments', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const respondAppointmentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof api.appointments.respond>[1];
    }) => api.appointments.respond(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointments', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const addMedicationMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof api.appointments.addMedication>[1];
    }) => api.appointments.addMedication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointments', variables.id, 'medications'],
      });
    },
  });

  return {
    appointmentsQuery,
    createAppointmentMutation,
    updateDiagnosisMutation,
    respondAppointmentMutation,
    addMedicationMutation,
  };
};

export const useAppointment = (id: number) => {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => api.appointments.get(id),
    enabled: !!id,
  });
};

export const useAppointmentMedications = (appointmentId: number) => {
  return useQuery({
    queryKey: ['appointments', appointmentId, 'medications'],
    queryFn: () => api.appointments.getMedications(appointmentId),
    enabled: !!appointmentId,
  });
};
