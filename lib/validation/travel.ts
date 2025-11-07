import { z } from 'zod';

export const TravelSlotCreateSchema = z.object({
  practitionerId: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  locationName: z.string().min(1).max(150),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  isRecurring: z.boolean().optional().default(false),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
});
export type TravelSlotCreateInput = z.infer<typeof TravelSlotCreateSchema>;

export const TravelSlotUpdateSchema = TravelSlotCreateSchema.partial();
export type TravelSlotUpdateInput = z.infer<typeof TravelSlotUpdateSchema>;

export const TravelSlotQuerySchema = z.object({
  practitionerId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  query: z.string().optional(),
});
export type TravelSlotQuery = z.infer<typeof TravelSlotQuerySchema>;
