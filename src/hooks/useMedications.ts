import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export const useMedications = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  const canFetchMedications =
    user?.role === 'patient' || user?.role === 'doctor';

  const medicationsQuery = useQuery({
    queryKey: ['medications'],
    queryFn: api.medications.list,
    enabled: !!token && hasHydrated && canFetchMedications,
  });

  return {
    medicationsQuery,
  };
};
