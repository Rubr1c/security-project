import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useLogs = () => {
  const logsQuery = useQuery({
    queryKey: ['logs'],
    queryFn: api.logs.list,
  });

  return {
    logsQuery,
  };
};
