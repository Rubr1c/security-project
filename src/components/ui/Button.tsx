'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 border border-teal-700/0',
  secondary:
    'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  danger:
    'bg-white text-red-700 border border-red-300 hover:bg-red-50 active:bg-red-100',
  ghost:
    'bg-transparent text-slate-800 border border-transparent hover:bg-slate-100 active:bg-slate-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold tracking-tight transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
