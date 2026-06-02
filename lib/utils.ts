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
