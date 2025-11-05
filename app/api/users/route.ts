import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId } from '@/lib/tenancy';
import { ROLE_VALUES, type Role } from '@/lib/constants/enums';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role') ?? undefined;
    const role = ROLE_VALUES.includes(roleParam as Role) ? (roleParam as Role) : undefined;
    const users = await prisma.user.findMany({
      where: {
        practiceId,
        ...(role ? { role } : {}),
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
    return NextResponse.json({ items: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
