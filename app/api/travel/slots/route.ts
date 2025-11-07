import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { TravelSlotCreateSchema, TravelSlotQuerySchema } from '@/lib/validation/travel';

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = TravelSlotQuerySchema.safeParse({
      practitionerId: searchParams.get('practitionerId') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      query: searchParams.get('query') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { practitionerId, from, to, query } = parsed.data;

    const where: any = {
      practitioner: { practiceId: user.practiceId },
    };

    if (user.role === 'practitioner') {
      where.practitionerId = user.id;
    } else if (practitionerId) {
      where.practitionerId = practitionerId;
    }

    if (from || to) {
      where.start = {};
      if (from) where.start.gte = new Date(from);
      if (to) where.start.lte = new Date(to);
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { locationName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const slots = await prisma.practitionerTravelSlot.findMany({
      where,
      orderBy: [{ start: 'asc' }],
      include: {
        practitioner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      items: slots.map((slot) => ({
        id: slot.id,
        practitionerId: slot.practitionerId,
        practitionerName: slot.practitioner?.name ?? slot.practitioner?.email ?? 'Practitioner',
        title: slot.title,
        description: slot.description,
        locationName: slot.locationName,
        latitude: slot.latitude,
        longitude: slot.longitude,
        start: slot.start,
        end: slot.end,
        isRecurring: slot.isRecurring,
        weekday: slot.weekday,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to load travel slots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const json = await req.json();
    const parsed = TravelSlotCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const start = new Date(data.start);
    const end = new Date(data.end);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start >= end) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
    }

    let targetPractitionerId = data.practitionerId ?? user.id;

    if (user.role === 'practitioner' && data.practitionerId && data.practitionerId !== user.id) {
      return NextResponse.json({ error: 'Practitioners cannot create slots for other team members' }, { status: 403 });
    }

    if (targetPractitionerId !== user.id) {
      const practitioner = await prisma.user.findFirst({
        where: { id: targetPractitionerId, practiceId: user.practiceId },
      });
      if (!practitioner) {
        return NextResponse.json({ error: 'Practitioner not found in practice' }, { status: 404 });
      }
    }

    const slot = await prisma.practitionerTravelSlot.create({
      data: {
        practitionerId: targetPractitionerId,
        title: data.title,
        description: data.description,
        locationName: data.locationName,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        start,
        end,
        isRecurring: data.isRecurring ?? false,
        weekday: data.isRecurring ? data.weekday ?? start.getUTCDay() : null,
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to create travel slot' }, { status: 500 });
  }
}
