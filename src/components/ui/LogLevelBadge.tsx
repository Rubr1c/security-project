'use client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogLevelBadgeProps {
  level: LogLevel;
}

const levelStyles: Record<LogLevel, { border: string; text: string }> = {
  debug: {
    border: 'border-slate-300',
    text: 'text-slate-700',
  },
  info: {
    border: 'border-teal-300',
    text: 'text-teal-800',
  },
  warn: {
    border: 'border-amber-300',
    text: 'text-amber-800',
  },
  error: {
    border: 'border-red-300',
    text: 'text-red-800',
  },
};

export function LogLevelBadge({ level }: LogLevelBadgeProps) {
  const style = levelStyles[level];

  return (
    <span
      className={`inline-flex items-center border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${style.border} ${style.text}`}
    >
      {level}
    </span>
  );
}
