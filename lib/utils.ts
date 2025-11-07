import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDateTime(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...opts,
  }).format(new Date(iso));
}

export function calculateAgeFromDate(dateInput: Date | string | null | undefined) {
  if (!dateInput) return null;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age < 0 ? 0 : age;
}
