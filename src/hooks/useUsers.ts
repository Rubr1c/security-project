import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export const useUsers = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const canFetchDoctors =
    user?.role === 'admin' ||
    user?.role === 'patient' ||
    user?.role === 'nurse';
  const canFetchNurses = user?.role === 'admin' || user?.role === 'doctor';
  const canFetchPatients = user?.role === 'doctor';

  const doctorsQuery = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: api.users.listDoctors,
    enabled: isAuthenticated && hasHydrated && canFetchDoctors,
  });

  const nursesQuery = useQuery({
    queryKey: ['users', 'nurses'],
    queryFn: api.users.listNurses,
    enabled: isAuthenticated && hasHydrated && canFetchNurses,
  });

  const patientsQuery = useQuery({
    queryKey: ['users', 'patients'],
    queryFn: api.users.listPatients,
    enabled: isAuthenticated && hasHydrated && canFetchPatients,
  });

  const assignNurseMutation = useMutation({
    mutationFn: (nurseId: number) => api.users.assignNurseToDoctor(nurseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'nurses'] });
    },
  });

  const unassignNurseMutation = useMutation({
    mutationFn: (nurseId: number) => api.users.unassignNurseFromDoctor(nurseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'nurses'] });
    },
  });

  return {
    doctorsQuery,
    nursesQuery,
    patientsQuery,
    assignNurseMutation,
    unassignNurseMutation,
  };
};
