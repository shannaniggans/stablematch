import { z } from 'zod';

export const PracticeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().min(3).optional(),
});
export type PracticeUpdateInput = z.infer<typeof PracticeUpdateSchema>;
