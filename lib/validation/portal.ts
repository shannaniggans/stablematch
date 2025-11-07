import { z } from 'zod';
import { HORSE_EDUCATION_LEVEL_VALUES, HORSE_SEX_VALUES, RIDING_STYLE_VALUES } from '@/lib/constants/horses';

const optionalDateInput = z
  .union([z.string(), z.date()])
  .transform((value) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    return undefined;
  })
  .optional();

export const ClientPortalRegisterSchema = z.object({
  practiceId: z.string().min(1, 'Practice is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  shareProfileWithPractitioners: z.boolean().optional(),
  shareHorsesWithPractitioners: z.boolean().optional(),
});
export type ClientPortalRegisterInput = z.infer<typeof ClientPortalRegisterSchema>;

export const ClientPortalProfileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  shareProfileWithPractitioners: z.boolean().optional(),
  shareHorsesWithPractitioners: z.boolean().optional(),
});
export type ClientPortalProfileUpdateInput = z.infer<typeof ClientPortalProfileUpdateSchema>;

export const ClientPortalHorseCreateSchema = z.object({
  name: z.string().min(1),
  breed: z.string().optional(),
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
  notes: z.string().optional(),
  photoDataUrl: z.string().optional(),
  color: z.string().optional(),
  height: z.string().optional(),
  sex: z.enum(HORSE_SEX_VALUES).optional(),
});
export type ClientPortalHorseCreateInput = z.infer<typeof ClientPortalHorseCreateSchema>;

export const ClientPortalHorseUpdateSchema = ClientPortalHorseCreateSchema.partial();
export type ClientPortalHorseUpdateInput = z.infer<typeof ClientPortalHorseUpdateSchema>;

export const ClientPortalSaddleCreateSchema = z.object({
  type: z.string().min(1),
  color: z.string().optional(),
  brand: z.string().optional(),
  seatSize: z.string().optional(),
  gulletWidth: z.string().optional(),
  notes: z.string().optional(),
});
export type ClientPortalSaddleCreateInput = z.infer<typeof ClientPortalSaddleCreateSchema>;

export const ClientPortalSaddleUpdateSchema = ClientPortalSaddleCreateSchema.partial();
export type ClientPortalSaddleUpdateInput = z.infer<typeof ClientPortalSaddleUpdateSchema>;

export const ClientPortalShareUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        practitionerId: z.string().min(1),
        shareProfile: z.boolean(),
        shareHorses: z.boolean(),
      }),
    )
    .max(50),
});
export type ClientPortalShareUpdateInput = z.infer<typeof ClientPortalShareUpdateSchema>;
