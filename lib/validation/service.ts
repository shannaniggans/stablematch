import { z } from 'zod';

export const ServiceCreateSchema = z.object({
  name: z.string().min(1),
  durationMins: z.coerce.number().int().min(5).max(8 * 60),
  priceCents: z.coerce.number().int().min(0),
  taxRate: z.coerce.number().min(0).max(1).optional().default(0.1),
  isActive: z.boolean().optional(),
});
export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>;

export const ServiceUpdateSchema = ServiceCreateSchema.partial();
export type ServiceUpdateInput = z.infer<typeof ServiceUpdateSchema>;

export const ServiceQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
});
