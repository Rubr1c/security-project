'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-slate-300 border-t-teal-600 ${sizeStyles[size]}`}
    />
  );
}
