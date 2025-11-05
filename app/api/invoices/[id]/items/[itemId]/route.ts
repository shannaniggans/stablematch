import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { InvoiceItemUpdateSchema } from '@/lib/validation/invoice-item';
import { recalculateInvoiceTotals } from '@/lib/server/invoice';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string; itemId: string };
}

async function ensureInvoice(practiceId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, practiceId } });
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  return invoice;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    await ensureInvoice(practiceId, params.id);
    const json = await req.json();
    const parsed = InvoiceItemUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const item = await prisma.invoiceItem.findUnique({ where: { id: params.itemId } });
    if (!item || item.invoiceId !== params.id) {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 });
    }
    await prisma.invoiceItem.update({
      where: { id: item.id },
      data: parsed.data,
    });
    await recalculateInvoiceTotals(params.id);
    const updated = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { client: true, items: true, payments: true },
    });
    if (updated) {
      await recordAuditLog({
        practiceId,
        userId,
        entityType: 'InvoiceItem',
        entityId: item.id,
        action: 'update',
        diffJSON: parsed.data,
      });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    await ensureInvoice(practiceId, params.id);
    const item = await prisma.invoiceItem.findUnique({ where: { id: params.itemId } });
    if (!item || item.invoiceId !== params.id) {
      return NextResponse.json({ error: 'Invoice item not found' }, { status: 404 });
    }
    await prisma.invoiceItem.delete({ where: { id: item.id } });
    await recalculateInvoiceTotals(params.id);
    const updated = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { client: true, items: true, payments: true },
    });
    if (updated) {
      await recordAuditLog({
        practiceId,
        userId,
        entityType: 'InvoiceItem',
        entityId: item.id,
        action: 'delete',
      });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Invoice not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
