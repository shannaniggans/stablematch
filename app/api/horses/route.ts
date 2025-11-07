import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { HorseCreateSchema, HorseQuerySchema } from '@/lib/validation/horse';
import { recordAuditLog } from '@/lib/server/audit';
import { normalizeHorsePayload } from '@/lib/server/horse';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const { searchParams } = new URL(req.url);
    const parsed = HorseQuerySchema.safeParse({
      clientId: searchParams.get('clientId') ?? undefined,
      query: searchParams.get('query') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const where: any = {
      client: { practiceId },
    };
    if (parsed.data.clientId) where.clientId = parsed.data.clientId;
    if (parsed.data.query) {
      where.OR = [
        { name: { contains: parsed.data.query, mode: 'insensitive' } },
        { breed: { contains: parsed.data.query, mode: 'insensitive' } },
      ];
    }
    const horses = await prisma.horse.findMany({
      where,
      include: { client: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ items: horses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = HorseCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, practiceId },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    const horseData = normalizeHorsePayload(parsed.data);
    const created = await prisma.horse.create({
      data: horseData,
      include: { client: true },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Horse',
      entityId: created.id,
      action: 'create',
      diffJSON: horseData,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
