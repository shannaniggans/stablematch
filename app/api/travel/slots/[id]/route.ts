import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { TravelSlotUpdateSchema } from '@/lib/validation/travel';

interface Params {
  params: { id: string };
}

async function ensureSlot(id: string, practiceId: string) {
  const slot = await prisma.practitionerTravelSlot.findFirst({
    where: { id, practitioner: { practiceId } },
  });
  if (!slot) {
    throw new Error('Slot not found');
  }
  return slot;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const slot = await ensureSlot(params.id, user.practiceId);
    if (user.role === 'practitioner' && slot.practitionerId !== user.id) {
      return NextResponse.json({ error: 'Not allowed to modify this slot' }, { status: 403 });
    }

    const json = await req.json();
    const parsed = TravelSlotUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = parsed.data;

    const updateData: any = { ...data };
    if (data.start) {
      const start = new Date(data.start);
      if (Number.isNaN(start.valueOf())) return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
      updateData.start = start;
    }
    if (data.end) {
      const end = new Date(data.end);
      if (Number.isNaN(end.valueOf())) return NextResponse.json({ error: 'Invalid end time' }, { status: 400 });
      updateData.end = end;
    }
    if (updateData.start && updateData.end && updateData.start >= updateData.end) {
      return NextResponse.json({ error: 'End must be after start' }, { status: 400 });
    }

    if (user.role === 'practitioner' && data.practitionerId && data.practitionerId !== user.id) {
      return NextResponse.json({ error: 'Cannot reassign slot to another practitioner' }, { status: 403 });
    }

    if (data.practitionerId && data.practitionerId !== slot.practitionerId) {
      const practitioner = await prisma.user.findFirst({
        where: { id: data.practitionerId, practiceId: user.practiceId },
      });
      if (!practitioner) {
        return NextResponse.json({ error: 'Practitioner not found in practice' }, { status: 404 });
      }
    }

    const updated = await prisma.practitionerTravelSlot.update({
      where: { id: slot.id },
      data: {
        practitionerId: data.practitionerId ?? slot.practitionerId,
        title: data.title ?? slot.title,
        description: data.description ?? slot.description,
        locationName: data.locationName ?? slot.locationName,
        latitude: data.latitude ?? slot.latitude,
        longitude: data.longitude ?? slot.longitude,
        start: updateData.start ?? slot.start,
        end: updateData.end ?? slot.end,
        isRecurring: data.isRecurring ?? slot.isRecurring,
        weekday: data.isRecurring ? data.weekday ?? slot.weekday ?? slot.start.getUTCDay() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Slot not found') {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message ?? 'Unable to update slot' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const slot = await ensureSlot(params.id, user.practiceId);
    if (user.role === 'practitioner' && slot.practitionerId !== user.id) {
      return NextResponse.json({ error: 'Not allowed to delete this slot' }, { status: 403 });
    }
    await prisma.practitionerTravelSlot.delete({ where: { id: slot.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'Slot not found') {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message ?? 'Unable to delete slot' }, { status: 500 });
  }
}
