import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { ServiceUpdateSchema } from '@/lib/validation/service';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const service = await prisma.service.findFirst({
      where: { id: params.id, practiceId },
    });
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const json = await req.json();
    const parsed = ServiceUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const existing = await prisma.service.findFirst({ where: { id: params.id, practiceId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.service.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Service',
      entityId: updated.id,
      action: 'update',
      diffJSON: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const existing = await prisma.service.findFirst({ where: { id: params.id, practiceId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.service.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Service',
      entityId: updated.id,
      action: 'delete',
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
