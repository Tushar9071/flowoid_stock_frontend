'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { parseValidationErrors } from '@/lib/utils';
import { PremiumSelect } from '@/components/ui/PremiumSelect';
import toast from 'react-hot-toast';

export type SimpleField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'file';
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
  error?: string | null; // legacy
  apiError?: any;
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
  error,
  apiError,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(error || null);
  const formRef = useRef<HTMLFormElement>(null);

  // Sync legacy error string
  useEffect(() => {
    if (error !== undefined) {
      setGlobalError(error);
    }
  }, [error]);

  // Parse new apiError object
  useEffect(() => {
    if (apiError) {
      const parsed = parseValidationErrors(apiError);
      setFieldErrors(parsed.fields);
      setGlobalError(parsed.global);
      
      // Auto-focus first invalid field after state update
      setTimeout(() => {
        if (formRef.current) {
          const firstInvalid = formRef.current.querySelector('[data-invalid="true"]') as HTMLElement;
          if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 50);
    } else {
      setFieldErrors({});
      if (error === undefined) setGlobalError(null);
    }
  }, [apiError, error]);

  const handleChange = (name: string, value: any) => {
    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      // Clear global validation error if there are no more field errors
      if (Object.keys(fieldErrors).length <= 1 && globalError === 'Please correct the highlighted fields and try again.') {
        setGlobalError(null);
      }
    }
    onChange(name, value);
  };

  return (
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center sm:p-6">
      <form ref={formRef} onSubmit={onSubmit} className="theme-modal-panel flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-xl font-bold theme-text-primary">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="theme-secondary-btn rounded-lg p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        {globalError && (
          <div className="mx-4 mt-4 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {globalError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4 md:grid-cols-2">
          {fields.map(field => (
            <label key={field.name} className={`block ${field.type === 'textarea' || field.type === 'file' ? 'md:col-span-2' : ''}`}>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </span>
              {field.type === 'select' ? (
                <PremiumSelect
                  value={values[field.name] ?? ''}
                  required={field.required}
                  onChange={(event: any) => handleChange(field.name, event.target.value)}
                  className={`h-10 w-full text-sm font-semibold rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 outline-none focus:border-[var(--color-accent)]`}
                  data-invalid={!!fieldErrors[field.name]}
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {(field.options || []).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </PremiumSelect>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={values[field.name] ?? ''}
                  required={field.required}
                  placeholder={field.placeholder}
                  onChange={event => handleChange(field.name, event.target.value)}
                  rows={3}
                  className={`w-full rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white p-3 text-sm outline-none focus:border-[var(--color-accent)]`}
                  data-invalid={!!fieldErrors[field.name]}
                />
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={event => handleChange(field.name, event.target.checked)}
                  className={`h-5 w-5 rounded ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-300'}`}
                  data-invalid={!!fieldErrors[field.name]}
                />
              ) : field.type === 'file' ? (
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={event => {
                    if (event.target.files) {
                      const files = Array.from(event.target.files);
                      const oversizedFiles = files.filter(f => f.size > 5 * 1024 * 1024);
                      if (oversizedFiles.length > 0) {
                        toast.error('File size must be less than 5MB');
                        event.target.value = '';
                        handleChange(field.name, []);
                        return;
                      }
                      handleChange(field.name, files);
                    } else {
                      handleChange(field.name, []);
                    }
                  }}
                  className={`block w-full rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white text-sm file:mr-3 file:h-10 file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-bold file:text-slate-600`}
                  data-invalid={!!fieldErrors[field.name]}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] ?? ''}
                  required={field.required}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  onChange={event => handleChange(field.name, event.target.value)}
                  className={`h-10 w-full rounded-lg border ${fieldErrors[field.name] ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]`}
                  data-invalid={!!fieldErrors[field.name]}
                />
              )}
              {fieldErrors[field.name] && (
                <p className="mt-1 text-[11px] font-semibold text-red-500">{fieldErrors[field.name]}</p>
              )}
              {field.hint && (
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{field.hint}</p>
              )}
            </label>
          ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 p-4">
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
