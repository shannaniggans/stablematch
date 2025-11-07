import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { ClientPortalSaddleUpdateSchema } from '@/lib/validation/portal';
import { deleteClientSaddle, updateClientSaddle } from '@/lib/server/saddle';

interface Params {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { client } = await requireClient();
    const saddle = await prisma.saddle.findFirst({
      where: { id: params.id, clientId: client.id },
    });
    if (!saddle) {
      return NextResponse.json({ error: 'Saddle not found' }, { status: 404 });
    }
    const json = await req.json();
    const parsed = ClientPortalSaddleUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const updated = await updateClientSaddle(saddle.id, client.id, parsed.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to update saddle' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { client } = await requireClient();
    const saddle = await prisma.saddle.findFirst({
      where: { id: params.id, clientId: client.id },
    });
    if (!saddle) {
      return NextResponse.json({ error: 'Saddle not found' }, { status: 404 });
    }
    await deleteClientSaddle(saddle.id, client.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to delete saddle' }, { status: 500 });
  }
}
