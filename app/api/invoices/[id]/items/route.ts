import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { InvoiceItemCreateSchema } from '@/lib/validation/invoice-item';
import { recalculateInvoiceTotals } from '@/lib/server/invoice';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = InvoiceItemCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, practiceId },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const item = await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: parsed.data.description,
        qty: parsed.data.qty,
        unitPriceCents: parsed.data.unitPriceCents,
        taxRate: parsed.data.taxRate ?? 0.1,
      },
    });
    await recalculateInvoiceTotals(invoice.id);
    const updated = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { client: true, items: true, payments: true },
    });
    if (updated) {
      await recordAuditLog({
        practiceId,
        userId,
        entityType: 'InvoiceItem',
        entityId: item.id,
        action: 'create',
        diffJSON: parsed.data,
      });
    }
    return NextResponse.json(updated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
