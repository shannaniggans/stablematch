import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { ServiceCreateSchema, ServiceQuerySchema } from '@/lib/validation/service';
import { recordAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const { searchParams } = new URL(req.url);
    const parsed = ServiceQuerySchema.safeParse({
      includeInactive: searchParams.get('includeInactive') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
    }
    const where = {
      practiceId,
      ...(parsed.data.includeInactive ? {} : { isActive: true }),
    };
    const services = await prisma.service.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json({ items: services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = ServiceCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const created = await prisma.service.create({
      data: { ...parsed.data, practiceId },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Service',
      entityId: created.id,
      action: 'create',
      diffJSON: parsed.data,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
