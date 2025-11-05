import { prisma } from '@/lib/prisma';

type InvoiceItemLike = {
  qty: number;
  unitPriceCents: number;
  taxRate?: number;
};

export function computeInvoiceTotals(items: InvoiceItemLike[]) {
  const subtotal = items.reduce((acc, item) => acc + item.qty * item.unitPriceCents, 0);
  const tax = items.reduce(
    (acc, item) => acc + Math.round(item.qty * item.unitPriceCents * (item.taxRate ?? 0.1)),
    0,
  );
  return {
    subtotalCents: subtotal,
    taxCents: tax,
    totalCents: subtotal + tax,
  };
}

export async function nextInvoiceNumber(practiceId: string) {
  const last = await prisma.invoice.findFirst({
    where: { practiceId },
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });
  const lastNum = last?.number ?? 'INV-0000';
  const parsed = Number.parseInt(lastNum.split('-')[1] ?? '0', 10) || 0;
  return 'INV-' + String(parsed + 1).padStart(4, '0');
}

export async function recalculateInvoiceTotals(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  const totals = computeInvoiceTotals(invoice.items);
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
    },
  });
}
