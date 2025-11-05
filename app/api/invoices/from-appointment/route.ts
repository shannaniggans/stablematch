// app/api/invoices/from-appointment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { InvoiceCreateFromApptSchema } from '@/lib/validation/invoice';
import { computeInvoiceTotals, nextInvoiceNumber } from '@/lib/server/invoice';
import { recordAuditLog } from '@/lib/server/audit';

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = InvoiceCreateFromApptSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const appt = await prisma.appointment.findFirst({
      where: { id: parsed.data.appointmentId, practiceId },
      include: { service: true, client: true },
    });
    if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    const totals = computeInvoiceTotals([
      { qty: 1, unitPriceCents: appt.service.priceCents, taxRate: appt.service.taxRate ?? 0.1 },
    ]);
    const number = await nextInvoiceNumber(practiceId);

    const inv = await prisma.invoice.create({
      data: {
        practiceId,
        number,
        clientId: appt.clientId,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 7*24*60*60*1000),
        status: 'draft',
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        items: {
          create: [{
            description: `${appt.service.name}`,
            qty: 1,
            unitPriceCents: appt.service.priceCents,
            taxRate: appt.service.taxRate ?? 0.1,
          }]
        }
      },
      include: { items: true },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Invoice',
      entityId: inv.id,
      action: 'create',
      diffJSON: { sourceAppointmentId: appt.id },
    });
    return NextResponse.json(inv, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
