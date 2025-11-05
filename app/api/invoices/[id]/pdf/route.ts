import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId } from '@/lib/tenancy';
import { renderInvoicePdf } from '@/lib/pdf/invoice';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, practiceId },
      include: { client: true, items: true, practice: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const buffer = await renderInvoicePdf(invoice);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + invoice.number + '.pdf"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
