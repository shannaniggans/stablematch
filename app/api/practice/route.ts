import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { recordAuditLog } from '@/lib/server/audit';
import { PracticeUpdateSchema } from '@/lib/validation/practice';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const practice = await prisma.practice.findUnique({ where: { id: practiceId } });
    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }
    return NextResponse.json(practice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = PracticeUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const practice = await prisma.practice.update({
      where: { id: practiceId },
      data: parsed.data,
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Practice',
      entityId: practiceId,
      action: 'update',
      diffJSON: parsed.data,
    });
    return NextResponse.json(practice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
