'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

  useEffect(() => {
    async function initCsrf() {
      try {
        const res = await fetch('/api/csrf', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCsrfToken(data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error);
      }
    }
    initCsrf();
  }, [setCsrfToken]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
