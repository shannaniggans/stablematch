// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { AppointmentCreateSchema, AppointmentListQuerySchema } from '@/lib/validation/appointment';
import { recordAuditLog } from '@/lib/server/audit';

export async function GET(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const { searchParams } = new URL(req.url);
    const parsed = AppointmentListQuerySchema.safeParse({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      practitionerId: searchParams.get('practitionerId') ?? undefined,
      clientId: searchParams.get('clientId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', issues: parsed.error.issues }, { status: 400 });
    }
    const { from, to, practitionerId, clientId, status } = parsed.data;
    const where: any = { practiceId };
    if (practitionerId) where.practitionerId = practitionerId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (from || to) where.start = {};
    if (from) where.start.gte = new Date(from);
    if (to) where.start.lte = new Date(to);

    const items = await prisma.appointment.findMany({
      where,
      include: { client: true, horse: true, service: true, practitioner: true },
      orderBy: { start: 'asc' },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const practiceId = getPracticeId(req);
    const json = await req.json();
    const parsed = AppointmentCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const { practitionerId, clientId, serviceId, horseId, start, end, status, locationText } = parsed.data;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!(startDate instanceof Date) || Number.isNaN(startDate.valueOf()) || !(endDate instanceof Date) || Number.isNaN(endDate.valueOf())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }
    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const [practitioner, client, service, horse] = await Promise.all([
      prisma.user.findFirst({ where: { id: practitionerId, practiceId } }),
      prisma.client.findFirst({ where: { id: clientId, practiceId }, include: { horses: true } }),
      prisma.service.findFirst({ where: { id: serviceId, practiceId } }),
      horseId
        ? prisma.horse.findFirst({ where: { id: horseId, client: { practiceId } } })
        : Promise.resolve(null),
    ]);

    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
    }
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (horseId && !horse) {
      return NextResponse.json({ error: 'Horse not found' }, { status: 404 });
    }

    // Conflict check
    const overlap = await prisma.appointment.findFirst({
      where: {
        practiceId,
        practitionerId,
        start: { lt: endDate },
        end: { gt: startDate },
      },
    });
    if (overlap) {
      return NextResponse.json({ error: 'Appointment conflict for practitioner' }, { status: 409 });
    }
    const created = await prisma.appointment.create({
      data: {
        practiceId,
        practitionerId,
        clientId,
        horseId: horseId ?? undefined,
        serviceId,
        start: startDate,
        end: endDate,
        status: status ?? undefined,
        locationText,
      },
      include: { client: true, horse: true, service: true, practitioner: true },
    });
    await recordAuditLog({
      practiceId,
      userId: getUserIdOptional(req),
      entityType: 'Appointment',
      entityId: created.id,
      action: 'create',
      diffJSON: parsed.data,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
