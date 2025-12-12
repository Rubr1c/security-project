import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export const useLogs = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const canFetchLogs = user?.role === 'admin';

  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: api.logs.list,
    enabled: isAuthenticated && hasHydrated && canFetchLogs,
  });

  return {
    logsQuery,
  };
};
