import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { HorseUpdateSchema } from '@/lib/validation/horse';
import { recordAuditLog } from '@/lib/server/audit';
import { normalizeHorsePayload } from '@/lib/server/horse';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const horse = await prisma.horse.findFirst({
      where: { id: params.id, client: { practiceId } },
      include: { client: true, appts: true },
    });
    if (!horse) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(horse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = HorseUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const existing = await prisma.horse.findFirst({
      where: { id: params.id, client: { practiceId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const horseData = normalizeHorsePayload(parsed.data);
    const updated = await prisma.horse.update({
      where: { id: existing.id },
      data: horseData,
      include: { client: true },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Horse',
      entityId: updated.id,
      action: 'update',
      diffJSON: horseData,
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
    const existing = await prisma.horse.findFirst({
      where: { id: params.id, client: { practiceId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.horse.delete({ where: { id: existing.id } });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Horse',
      entityId: existing.id,
      action: 'delete',
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
