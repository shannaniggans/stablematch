import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { AvailabilityUpdateSchema } from '@/lib/validation/availability';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string };
}

function timeRangeConflict(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const json = await req.json();
    const parsed = AvailabilityUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }

    const existing = await prisma.availability.findFirst({
      where: { id: params.id, practitioner: { practiceId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const nextPractitionerId = parsed.data.practitionerId ?? existing.practitionerId;
    const nextWeekday = parsed.data.weekday ?? existing.weekday;
    const nextStart = parsed.data.startTime ?? existing.startTime;
    const nextEnd = parsed.data.endTime ?? existing.endTime;

    if (nextStart >= nextEnd) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const practitioner = await prisma.user.findFirst({
      where: { id: nextPractitionerId, practiceId },
    });
    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
    }

    const conflicts = await prisma.availability.findMany({
      where: {
        practitionerId: nextPractitionerId,
        weekday: nextWeekday,
        id: { not: existing.id },
        AND: [
          { startTime: { lt: nextEnd } },
          { endTime: { gt: nextStart } },
        ],
      },
    });

    if (conflicts.some((slot) => timeRangeConflict(slot.startTime, slot.endTime, nextStart, nextEnd))) {
      return NextResponse.json({ error: 'Availability conflict' }, { status: 409 });
    }

    const updated = await prisma.availability.update({
      where: { id: existing.id },
      data: {
        practitionerId: nextPractitionerId,
        weekday: nextWeekday,
        startTime: nextStart,
        endTime: nextEnd,
        effectiveFrom: parsed.data.effectiveFrom ? new Date(parsed.data.effectiveFrom) : existing.effectiveFrom,
        effectiveTo: parsed.data.effectiveTo ? new Date(parsed.data.effectiveTo) : existing.effectiveTo,
      },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Availability',
      entityId: updated.id,
      action: 'update',
      diffJSON: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserIdOptional(req);
    const existing = await prisma.availability.findFirst({
      where: { id: params.id, practitioner: { practiceId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await prisma.availability.delete({ where: { id: existing.id } });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Availability',
      entityId: existing.id,
      action: 'delete',
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
