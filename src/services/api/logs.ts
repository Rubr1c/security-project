import { apiClient } from './client';

interface Log {
  id: number;
  timestamp: string;
  message: string;
  meta: string | null;
  error: string | null;
  level: 'debug' | 'info' | 'warn' | 'error';
}

export interface PaginatedLogs {
  data: Log[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const logs = {
  list: async (page = 1, limit = 50) => {
    const response = await apiClient.get<PaginatedLogs>('/logs', {
      params: { page, limit },
    });
    return response.data;
  },
};
