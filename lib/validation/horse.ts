import { z } from 'zod';
import { HORSE_EDUCATION_LEVEL_VALUES, HORSE_SEX_VALUES, RIDING_STYLE_VALUES } from '@/lib/constants/horses';

const optionalDateInput = z
  .union([z.string(), z.date()])
  .transform((value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    return undefined;
  })
  .optional();

export const HorseCreateSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  breed: z.string().optional(),
  age: z
    .union([z.number(), z.string()])
    .transform((value) => (typeof value === 'string' && value.trim() === '' ? undefined : Number(value)))
    .pipe(z.number().int().min(0).max(60).optional())
    .optional(),
  dateOfBirth: optionalDateInput,
  typeOfRiding: z.enum(RIDING_STYLE_VALUES).optional(),
  educationLevel: z.enum(HORSE_EDUCATION_LEVEL_VALUES).optional(),
  behaviouralNotes: z.string().optional(),
  lastDentalDate: optionalDateInput,
  lastVaccinationDate: optionalDateInput,
  lastSaddleFitDate: optionalDateInput,
  lastWormingDate: optionalDateInput,
  propertyName: z.string().optional(),
  propertyAddress: z.string().optional(),
  picNumber: z.string().optional(),
  photoDataUrl: z.string().optional(),
  color: z.string().optional(),
  height: z.string().optional(),
  sex: z.enum(HORSE_SEX_VALUES).optional(),
  notes: z.string().optional(),
});
export type HorseCreateInput = z.infer<typeof HorseCreateSchema>;

export const HorseUpdateSchema = HorseCreateSchema.omit({ clientId: true }).partial();
export type HorseUpdateInput = z.infer<typeof HorseUpdateSchema>;

export const HorseQuerySchema = z.object({
  clientId: z.string().optional(),
  query: z.string().optional(),
});
