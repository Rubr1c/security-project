'use client';

import type { AppointmentStatus } from '@/lib/db/types';

interface StatusBadgeProps {
  status: AppointmentStatus;
}

const statusStyles: Record<AppointmentStatus, { bg: string; text: string; dot: string }> = {
  pending: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  confirmed: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  denied: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
  completed: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

