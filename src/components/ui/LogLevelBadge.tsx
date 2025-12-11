'use client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogLevelBadgeProps {
  level: LogLevel;
}

const levelStyles: Record<LogLevel, { bg: string; text: string }> = {
  debug: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  warn: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
};

export function LogLevelBadge({ level }: LogLevelBadgeProps) {
  const style = levelStyles[level];

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium uppercase ${style.bg} ${style.text}`}
    >
      {level}
    </span>
  );
}
