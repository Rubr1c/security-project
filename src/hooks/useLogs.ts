import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export const useLogs = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const canFetchLogs = user?.role === 'admin';

  const logsQuery = useInfiniteQuery({
    queryKey: ['logs'],
    queryFn: ({ pageParam }) => api.logs.list(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated && hasHydrated && canFetchLogs,
  });

  return {
    logsQuery,
  };
};
