'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={id}
          className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-950 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-teal-600/30 ${
            error ? 'border-red-400 focus:ring-red-600/25' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
