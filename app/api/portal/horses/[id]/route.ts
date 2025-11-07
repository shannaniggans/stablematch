import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { ClientPortalHorseUpdateSchema } from '@/lib/validation/portal';
import { normalizeHorsePayload } from '@/lib/server/horse';

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { client } = await requireClient();
    const horse = await prisma.horse.findFirst({
      where: { id: params.id, clientId: client.id },
    });
    if (!horse) {
      return NextResponse.json({ error: 'Horse not found' }, { status: 404 });
    }
    const json = await req.json();
    const parsed = ClientPortalHorseUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const payload = normalizeHorsePayload(parsed.data);
    const updated = await prisma.horse.update({
      where: { id: horse.id },
      data: payload,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to update horse' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { client } = await requireClient();
    const horse = await prisma.horse.findFirst({
      where: { id: params.id, clientId: client.id },
    });
    if (!horse) {
      return NextResponse.json({ error: 'Horse not found' }, { status: 404 });
    }
    await prisma.horse.delete({ where: { id: horse.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to delete horse' }, { status: 500 });
  }
}
