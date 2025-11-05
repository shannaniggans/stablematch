import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId } from '@/lib/tenancy';
import { createInvoiceCheckoutSession } from '@/lib/payments/stripe';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, practiceId },
      include: { client: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const origin = req.headers.get('origin') ?? req.nextUrl.origin;
    const successUrl = origin + '/invoices/' + invoice.id + '?status=payment-success';
    const cancelUrl = origin + '/invoices/' + invoice.id;

    const session = await createInvoiceCheckoutSession({
      invoiceId: invoice.id,
      amountCents: invoice.totalCents,
      customerEmail: invoice.client.email,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
