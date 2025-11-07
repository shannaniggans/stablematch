// lib/validation/client.ts
import { z } from 'zod';

export const ClientCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  shareProfileWithPractitioners: z.boolean().optional(),
  shareHorsesWithPractitioners: z.boolean().optional(),
});
export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;

export const ClientUpdateSchema = ClientCreateSchema.partial();
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;

export const ClientQuerySchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
