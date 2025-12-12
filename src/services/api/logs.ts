import { apiClient } from './client';

interface Log {
  id: number;
  timestamp: string;
  message: string;
  meta: string | null;
  error: string | null;
  level: 'debug' | 'info' | 'warn' | 'error';
}

export const logs = {
  list: async () => {
    const response = await apiClient.get<Log[]>('/logs');
    return response.data;
  },
};
