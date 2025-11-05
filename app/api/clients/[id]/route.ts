// app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { ClientUpdateSchema } from '@/lib/validation/client';
import { recordAuditLog } from '@/lib/server/audit';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const item = await prisma.client.findFirst({
      where: { id: params.id, practiceId },
      include: { horses: true, appts: true, invoices: true },
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
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = ClientUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const exists = await prisma.client.findFirst({ where: { id: params.id, practiceId } });
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.client.update({
      where: { id: exists.id },
      data: parsed.data,
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Client',
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
    const exists = await prisma.client.findFirst({ where: { id: params.id, practiceId } });
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.client.delete({ where: { id: exists.id } });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Client',
      entityId: exists.id,
      action: 'delete',
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
