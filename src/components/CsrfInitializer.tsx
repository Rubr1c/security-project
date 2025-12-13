'use client';

import { useCsrf } from '@/hooks/useCsrf';

export function CsrfInitializer() {
  useCsrf();
  return null;
}
