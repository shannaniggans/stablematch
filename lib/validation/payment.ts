import { z } from 'zod';

export const PaymentCreateSchema = z.object({
  amountCents: z.coerce.number().int().min(1),
  method: z.string().min(1),
  paidAt: z.string().datetime(),
  stripePaymentIntentId: z.string().optional(),
});
export type PaymentCreateInput = z.infer<typeof PaymentCreateSchema>;
