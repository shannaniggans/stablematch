import { z } from 'zod';

export const HorseCreateSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  breed: z.string().optional(),
  age: z
    .union([z.number(), z.string()])
    .transform((value) => (typeof value === 'string' && value.trim() === '' ? undefined : Number(value)))
    .pipe(z.number().int().min(0).max(60).optional())
    .optional(),
  notes: z.string().optional(),
});
export type HorseCreateInput = z.infer<typeof HorseCreateSchema>;

export const HorseUpdateSchema = HorseCreateSchema.omit({ clientId: true }).partial();
export type HorseUpdateInput = z.infer<typeof HorseUpdateSchema>;

export const HorseQuerySchema = z.object({
  clientId: z.string().optional(),
  query: z.string().optional(),
});
