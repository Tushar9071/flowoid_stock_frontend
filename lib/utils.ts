import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number for the backend API without changing its country
 * prefix. The backend stores and matches phone numbers exactly.
 */
export function normalizePhoneForApi(phone: string): string {
  if (!phone) return phone;

  const trimmed = phone.trim();
  const hasInternationalPrefix = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  return hasInternationalPrefix ? `+${digits}` : digits;
}

/**
 * Extracts validation error details from a backend API error response.
 */
export function formatApiError(error?: { message?: string; details?: any } | null, fallback = 'An error occurred'): string {
  if (!error) return fallback;
  const base = error.message || fallback;
  const details = error.details;
  if (!details) return base;
  // details may be string[], Record<string, string[]>, or a mixed array
  const lines: string[] = [];
  if (Array.isArray(details)) {
    details.forEach((d: any) => {
      if (typeof d === 'string') lines.push(d);
      else if (d?.message) lines.push(d.message);
      else if (d?.constraints) lines.push(...Object.values(d.constraints as Record<string, string>));
    });
  } else if (typeof details === 'object') {
    Object.values(details).forEach((v: any) => {
      if (Array.isArray(v)) v.forEach((s: string) => lines.push(s));
      else if (typeof v === 'string') lines.push(v);
    });
  }
  if (lines.length === 0) return base;
  return `${base}:\n• ${lines.join('\n• ')}`;
}

/**
 * Parses ZodError flatten() format from the backend into field-level errors and a global error.
 */
export function parseValidationErrors(error?: any): { global: string | null; fields: Record<string, string> } {
  const result = { global: null as string | null, fields: {} as Record<string, string> };
  
  if (!error) return result;

  // Backend usually returns error.code === 'VALIDATION_ERROR' and details is flattened ZodError
  if (error.code === 'VALIDATION_ERROR' && error.details?.fieldErrors) {
    const fieldErrors = error.details.fieldErrors;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        result.fields[field] = messages[0];
      }
    });
    
    if (error.details.formErrors && error.details.formErrors.length > 0) {
      result.global = error.details.formErrors[0];
    } else if (Object.keys(result.fields).length > 0) {
      result.global = 'Please correct the highlighted fields and try again.';
    } else {
      result.global = error.message || 'Validation failed';
    }
  } else {
    // If not a validation error, or unexpected shape, fall back to global error message
    result.global = error.message || 'Unable to save. Please try again.';
  }

  return result;
}
