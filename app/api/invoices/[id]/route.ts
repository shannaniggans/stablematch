// app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { InvoiceUpdateSchema } from '@/lib/validation/invoice';
import { recordAuditLog } from '@/lib/server/audit';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const item = await prisma.invoice.findFirst({
      where: { id: params.id, practiceId },
      include: { client: true, items: true, payments: true },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const json = await req.json();
    const parsed = InvoiceUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const exists = await prisma.invoice.findFirst({ where: { id: params.id, practiceId } });
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.invoice.update({
      where: { id: exists.id },
      data: {
        status: parsed.data.status ?? exists.status,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : exists.dueAt,
      },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Invoice',
      entityId: updated.id,
      action: 'update',
      diffJSON: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const invoice = await prisma.invoice.findFirst({ where: { id: params.id, practiceId } });
    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'void' },
      include: { client: true, items: true, payments: true },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Invoice',
      entityId: updated.id,
      action: 'delete',
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
