'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastInput {
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastInternal extends Required<ToastInput> {
  id: string;
}

interface ToastContextValue {
  push: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const item: ToastInternal = {
        id,
        title: toast.title,
        message: toast.message ?? '',
        variant: toast.variant ?? 'info',
        durationMs: toast.durationMs ?? 4500,
      };

      setToasts((prev) => [item, ...prev].slice(0, 4));

      window.setTimeout(() => remove(id), item.durationMs);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    toast: ctx.push,
    success: (title: string, message?: string) =>
      ctx.push({ title, message, variant: 'success' }),
    error: (title: string, message?: string) =>
      ctx.push({ title, message, variant: 'error' }),
    info: (title: string, message?: string) =>
      ctx.push({ title, message, variant: 'info' }),
  };
}

function ToastViewport({
  toasts,
  onClose,
}: {
  toasts: ToastInternal[];
  onClose: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-3 right-3 z-50 grid w-[360px] max-w-[calc(100vw-24px)] gap-3"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastInternal;
  onClose: () => void;
}) {
  const styles: Record<
    ToastVariant,
    { bar: string; bg: string; text: string }
  > = {
    success: { bar: 'bg-teal-600', bg: 'bg-white', text: 'text-slate-950' },
    info: { bar: 'bg-slate-700', bg: 'bg-white', text: 'text-slate-950' },
    error: { bar: 'bg-red-600', bg: 'bg-white', text: 'text-slate-950' },
  };

  const s = styles[toast.variant];

  return (
    <div className={`border border-slate-200 ${s.bg}`}>
      <div className={`h-1 ${s.bar}`} />
      <div className="grid gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm font-extrabold tracking-tight ${s.text}`}>
            {toast.title}
          </p>
          <button
            type="button"
            aria-label="Close toast"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {toast.message ? (
          <p className="text-sm leading-6 text-slate-700">{toast.message}</p>
        ) : null}
      </div>
    </div>
  );
}
