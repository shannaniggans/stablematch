import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { AvailabilityCreateSchema } from '@/lib/validation/availability';
import { recordAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const { searchParams } = new URL(req.url);
    const practitionerId = searchParams.get('practitionerId') ?? undefined;
    const where: any = { practitioner: { practiceId } };
    if (practitionerId) where.practitionerId = practitionerId;
    const items = await prisma.availability.findMany({
      where,
      include: { practitioner: true },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function timeRangeConflict(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB;
}

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const json = await req.json();
    const parsed = AvailabilityCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const { practitionerId, weekday, startTime, endTime, effectiveFrom, effectiveTo } = parsed.data;
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }
    const practitioner = await prisma.user.findFirst({
      where: { id: practitionerId, practiceId },
    });
    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
    }

    const conflicts = await prisma.availability.findMany({
      where: {
        practitionerId,
        weekday,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (conflicts.some((slot) => timeRangeConflict(slot.startTime, slot.endTime, startTime, endTime))) {
      return NextResponse.json({ error: 'Availability conflict' }, { status: 409 });
    }

    const created = await prisma.availability.create({
      data: {
        practitionerId,
        weekday,
        startTime,
        endTime,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Availability',
      entityId: created.id,
      action: 'create',
      diffJSON: parsed.data,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
