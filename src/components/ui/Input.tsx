'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-slate-900"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`block h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-950 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 ${
            error ? 'border-red-400 focus:ring-red-600/25' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
