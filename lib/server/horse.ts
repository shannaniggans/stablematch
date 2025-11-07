import { calculateAgeFromDate } from '@/lib/utils';

const OPTIONAL_TEXT_FIELDS = [
  'breed',
  'notes',
  'typeOfRiding',
  'educationLevel',
  'behaviouralNotes',
  'propertyName',
  'picNumber',
  'propertyAddress',
  'color',
  'height',
  'sex',
] as const;

const DATE_FIELDS = [
  'dateOfBirth',
  'lastDentalDate',
  'lastVaccinationDate',
  'lastSaddleFitDate',
  'lastWormingDate',
] as const;

type HorseInput = Record<string, any>;

function parseDateValue(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed.length) return null;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00` : trimmed;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.valueOf())) return null;
    return parsed;
  }
  return null;
}

export function normalizeHorsePayload<T extends HorseInput>(input: T) {
  const payload: HorseInput = {};

  if ('clientId' in input) {
    payload.clientId = input.clientId;
  }
  if ('name' in input && input.name !== undefined) {
    payload.name = input.name;
  }

  OPTIONAL_TEXT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = input[field];
      if (value === undefined) return;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        payload[field] = trimmed.length ? trimmed : null;
      } else {
        payload[field] = value ?? null;
      }
    }
  });

  if (Object.prototype.hasOwnProperty.call(input, 'photoDataUrl')) {
    const value = input.photoDataUrl;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      payload.photoDataUrl = trimmed.length ? trimmed : null;
    } else {
      payload.photoDataUrl = value ?? null;
    }
  }

  DATE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = input[field];
      if (value === null || value === '') {
        payload[field] = null;
      } else if (value !== undefined) {
        const parsedDate = parseDateValue(value);
        if (parsedDate) {
          payload[field] = parsedDate;
        }
      }
    }
  });

  if (Object.prototype.hasOwnProperty.call(input, 'age')) {
    payload.age = input.age ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'dateOfBirth') && payload.dateOfBirth instanceof Date) {
    const computedAge = calculateAgeFromDate(payload.dateOfBirth);
    if (computedAge != null) {
      payload.age = computedAge;
    }
  }

  return payload;
}
