import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export const useLogs = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const canFetchLogs = user?.role === 'admin';

  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: api.logs.list,
    enabled: !!token && hasHydrated && canFetchLogs,
  });

  return {
    logsQuery,
  };
};
