import React, { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  headerAction?: ReactNode;
  hideCloseButton?: boolean;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', headerAction, hideCloseButton }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 pt-10 sm:py-12">
        <div className={`relative w-full ${sizes[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-100 flex flex-col z-10 animate-scale-in max-h-[90vh] sm:max-h-[85vh] overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-white z-20 shrink-0">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <div className="flex items-center gap-1 ml-auto">
              {headerAction}
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
