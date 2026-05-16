'use client';

import React from 'react';
import { X } from 'lucide-react';

export type SimpleField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  hint?: React.ReactNode;
};

type Props = {
  title: string;
  subtitle?: string;
  fields: SimpleField[];
  values: Record<string, any>;
  saving?: boolean;
  submitLabel?: string;
  onChange: (name: string, value: any) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function SimpleRecordModal({
  title,
  subtitle,
  fields,
  values,
  saving,
  submitLabel = 'Save',
  onChange,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <form onSubmit={onSubmit} className="theme-modal-panel w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          {fields.map(field => (
            <label key={field.name} className={`block ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </span>
              {field.type === 'select' ? (
                <select
                  value={values[field.name] ?? ''}
                  required={field.required}
                  onChange={event => onChange(field.name, event.target.value)}
                  className="h-10 w-full text-sm font-semibold"
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {(field.options || []).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={values[field.name] ?? ''}
                  required={field.required}
                  placeholder={field.placeholder}
                  onChange={event => onChange(field.name, event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={event => onChange(field.name, event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] ?? ''}
                  required={field.required}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  onChange={event => onChange(field.name, event.target.value)}
                  className="h-10 w-full text-sm"
                />
              )}
              {field.hint && (
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{field.hint}</p>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button disabled={saving} className="theme-accent-btn rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
