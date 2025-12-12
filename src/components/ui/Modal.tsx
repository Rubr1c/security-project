'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const titleId = `modal-title-${title.replaceAll(/\s+/g, '-').toLowerCase()}`;

  const modalContent = (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-slate-950/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="absolute inset-y-0 right-0 w-[480px] max-w-[92vw] border-l border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <div className="min-w-0">
            <p
              id={titleId}
              className="truncate text-sm font-semibold text-slate-950"
            >
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Close"
            autoFocus
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-[calc(100dvh-49px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
