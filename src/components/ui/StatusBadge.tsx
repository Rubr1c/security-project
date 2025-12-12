'use client';

import type { AppointmentStatus } from '@/lib/db/types';

interface StatusBadgeProps {
  status: AppointmentStatus;
}

const statusStyles: Record<
  AppointmentStatus,
  { border: string; text: string }
> = {
  pending: {
    border: 'border-amber-300',
    text: 'text-amber-800',
  },
  confirmed: {
    border: 'border-teal-300',
    text: 'text-teal-800',
  },
  denied: {
    border: 'border-red-300',
    text: 'text-red-800',
  },
  completed: {
    border: 'border-slate-300',
    text: 'text-slate-800',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center border px-2 py-1 text-[11px] font-semibold tracking-wide uppercase ${style.border} ${style.text}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
