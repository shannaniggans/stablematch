import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { optionalUser } from '@/lib/auth/utils';
import { TravelSlotQuerySchema } from '@/lib/validation/travel';

export async function GET(req: NextRequest) {
  try {
    const session = await auth(req);
    let practiceId = session?.user.practiceId ?? null;
    if (!practiceId) {
      const fallbackUser = await optionalUser();
      practiceId = fallbackUser?.practiceId ?? null;
    }
    if (!practiceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = TravelSlotQuerySchema.extend({
      practitionerId: TravelSlotQuerySchema.shape.practitionerId.optional(),
    }).safeParse({
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
      practitioner: { practiceId },
    };

    if (practitionerId) {
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
          select: { id: true, name: true, email: true, role: true },
        },
      },
      take: 100,
    });

    return NextResponse.json({
      items: slots.map((slot) => ({
        id: slot.id,
        practitioner: slot.practitioner,
        title: slot.title,
        locationName: slot.locationName,
        description: slot.description,
        latitude: slot.latitude,
        longitude: slot.longitude,
        start: slot.start,
        end: slot.end,
        isRecurring: slot.isRecurring,
        weekday: slot.weekday,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to search travel slots' }, { status: 500 });
  }
}
