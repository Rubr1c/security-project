'use client';

import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="grid gap-3 border border-dashed border-slate-300 bg-slate-50 p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-teal-700">
          {icon || <Inbox className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
