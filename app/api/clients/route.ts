// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { ClientCreateSchema, ClientQuerySchema } from '@/lib/validation/client';
import { recordAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const { searchParams } = new URL(req.url);
    const parse = ClientQuerySchema.safeParse({
      query: searchParams.get('query') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    });
    if (!parse.success) {
      return NextResponse.json({ error: 'Invalid query', issues: parse.error.issues }, { status: 400 });
    }
    const { query, page = 1, pageSize = 20 } = parse.data;
    const where = {
      practiceId,
      ...(query ? {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ]
      } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.client.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, pageSize });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = ClientCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const created = await prisma.client.create({
      data: { ...parsed.data, practiceId },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Client',
      entityId: created.id,
      action: 'create',
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
