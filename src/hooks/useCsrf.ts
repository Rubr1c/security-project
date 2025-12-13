import { useState, useEffect } from 'react';

// ... imports
import { useAuthStore } from '@/store/auth';

export function useCsrf() {
  const [csrfToken, setCsrfTokenState] = useState<string | null>(null);
  const setGlobalCsrfToken = useAuthStore((state) => state.setCsrfToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch('/api/csrf');
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await response.json();
        setCsrfTokenState(data.csrfToken);
        setGlobalCsrfToken(data.csrfToken);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchCsrfToken();
  }, []);

  return { csrfToken, loading, error };
}
