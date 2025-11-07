import { z } from 'zod';

export const SaddleCreateSchema = z.object({
  clientId: z.string().min(1),
  type: z.string().min(1),
  color: z.string().optional(),
  brand: z.string().optional(),
  seatSize: z.string().optional(),
  gulletWidth: z.string().optional(),
  notes: z.string().optional(),
});
export type SaddleCreateInput = z.infer<typeof SaddleCreateSchema>;

export const SaddleUpdateSchema = SaddleCreateSchema.omit({ clientId: true }).partial();
export type SaddleUpdateInput = z.infer<typeof SaddleUpdateSchema>;
