import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/server/audit';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';

interface Params {
  params: { id: string; paymentId: string };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, practiceId },
      include: { payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const payment = invoice.payments.find((p) => p.id === params.paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    await prisma.payment.delete({ where: { id: payment.id } });
    const remaining = invoice.payments
      .filter((p) => p.id !== payment.id)
      .reduce((acc, p) => acc + p.amountCents, 0);
    if (remaining < invoice.totalCents && invoice.status === 'paid') {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'sent' } });
    }
    const updated = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: { client: true, items: true, payments: true },
    });
    if (updated) {
      await recordAuditLog({
        practiceId,
        userId,
        entityType: 'Payment',
        entityId: payment.id,
        action: 'delete',
      });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
