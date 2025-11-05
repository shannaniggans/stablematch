import { z } from 'zod';

const TimeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time');

export const AvailabilityCreateSchema = z.object({
  practitionerId: z.string().min(1),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: TimeString,
  endTime: TimeString,
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});
export type AvailabilityCreateInput = z.infer<typeof AvailabilityCreateSchema>;

export const AvailabilityUpdateSchema = AvailabilityCreateSchema.partial().extend({
  practitionerId: z.string().optional(),
});
export type AvailabilityUpdateInput = z.infer<typeof AvailabilityUpdateSchema>;
