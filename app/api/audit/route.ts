import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId } from '@/lib/tenancy';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get('limit') ?? '50', 10);
    const logs = await prisma.auditLog.findMany({
      where: { practiceId },
      orderBy: { createdAt: 'desc' },
      take: Number.isNaN(limit) ? 50 : Math.min(limit, 100),
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ items: logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
