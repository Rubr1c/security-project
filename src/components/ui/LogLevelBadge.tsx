'use client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogLevelBadgeProps {
  level: LogLevel;
}

const levelStyles: Record<LogLevel, { bg: string; text: string }> = {
  debug: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
  },
  warn: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
  },
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
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
