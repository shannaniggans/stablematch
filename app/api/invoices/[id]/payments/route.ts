import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { PaymentCreateSchema } from '@/lib/validation/payment';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = PaymentCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, practiceId },
      include: { payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amountCents: parsed.data.amountCents,
        method: parsed.data.method,
        paidAt: new Date(parsed.data.paidAt),
        stripePaymentIntentId: parsed.data.stripePaymentIntentId,
      },
    });
    const totalPaid = invoice.payments.reduce((acc, p) => acc + p.amountCents, 0) + parsed.data.amountCents;
    if (totalPaid >= invoice.totalCents && invoice.status !== 'paid') {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'paid' } });
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
        action: 'create',
        diffJSON: parsed.data,
      });
    }
    return NextResponse.json(updated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
