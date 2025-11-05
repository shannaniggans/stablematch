import { z } from 'zod';

export const InvoiceItemCreateSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().int().min(1),
  unitPriceCents: z.coerce.number().int().min(0),
  taxRate: z.coerce.number().min(0).max(1).optional().default(0.1),
});
export type InvoiceItemCreateInput = z.infer<typeof InvoiceItemCreateSchema>;

export const InvoiceItemUpdateSchema = InvoiceItemCreateSchema.partial();
export type InvoiceItemUpdateInput = z.infer<typeof InvoiceItemUpdateSchema>;
