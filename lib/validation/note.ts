import { z } from 'zod';

export const NoteCreateSchema = z.object({
  appointmentId: z.string().min(1),
  body: z.string().min(1),
  isPrivate: z.coerce.boolean().optional().default(true),
});
export type NoteCreateInput = z.infer<typeof NoteCreateSchema>;

export const NoteUpdateSchema = z.object({
  body: z.string().min(1).optional(),
  isPrivate: z.coerce.boolean().optional(),
});
export type NoteUpdateInput = z.infer<typeof NoteUpdateSchema>;
