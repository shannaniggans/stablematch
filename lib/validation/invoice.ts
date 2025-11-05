// lib/validation/invoice.ts
import { z } from 'zod';
import { InvoiceItemCreateSchema } from './invoice-item';
import { INVOICE_STATUS_VALUES } from '@/lib/constants/enums';

const InvoiceStatusEnum = z.enum(INVOICE_STATUS_VALUES);

export const InvoiceCreateSchema = z.object({
  clientId: z.string().min(1),
  issuedAt: z.string().datetime(),
  dueAt: z.string().datetime(),
  status: InvoiceStatusEnum.optional().default('draft'),
  items: z.array(InvoiceItemCreateSchema).nonempty(),
});
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceCreateFromApptSchema = z.object({
  appointmentId: z.string().min(1),
});
export type InvoiceCreateFromApptInput = z.infer<typeof InvoiceCreateFromApptSchema>;

export const InvoiceUpdateSchema = z.object({
  status: InvoiceStatusEnum.optional(),
  dueAt: z.string().datetime().optional(),
});
export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdateSchema>;

export const InvoiceListQuerySchema = z.object({
  status: InvoiceStatusEnum.optional(),
  clientId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
