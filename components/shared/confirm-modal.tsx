'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6 animate-in fade-in duration-200">
      <div className="theme-modal-panel w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{message}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex justify-end gap-3 bg-slate-50 p-4 sm:px-6">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'theme-accent-btn'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
