import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number for the backend API.
 * Ensures the +91 prefix is present for 10-digit or 12-digit (starting with 91) Indian numbers.
 */
export function normalizePhoneForApi(phone: string): string {
  if (!phone) return phone;
  
  // Keep only digits and the plus sign
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it's a 10 digit number, add +91 prefix
  if (/^\d{10}$/.test(cleaned)) {
    return '+91' + cleaned;
  }
  
  // If it starts with 91 followed by 10 digits, add +
  if (/^91\d{10}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  
  return cleaned;
}
