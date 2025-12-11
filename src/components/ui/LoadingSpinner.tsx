'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-amber-500 border-t-transparent ${sizeStyles[size]}`}
    />
  );
}

