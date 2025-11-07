import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { ClientPortalHorseCreateSchema } from '@/lib/validation/portal';
import { normalizeHorsePayload } from '@/lib/server/horse';

export async function GET() {
  try {
    const { client } = await requireClient();
    const horses = await prisma.horse.findMany({
      where: { clientId: client.id },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ items: horses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to fetch horses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { client } = await requireClient();
    const json = await req.json();
    const parsed = ClientPortalHorseCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const payload = normalizeHorsePayload({
      clientId: client.id,
      ...parsed.data,
    });
    const horse = await prisma.horse.create({
      data: payload,
    });
    return NextResponse.json(horse, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to add horse' }, { status: 500 });
  }
}
