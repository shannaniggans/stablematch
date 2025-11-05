// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserIdOptional } from '@/lib/tenancy';
import { AppointmentUpdateSchema } from '@/lib/validation/appointment';
import { recordAuditLog } from '@/lib/server/audit';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const item = await prisma.appointment.findFirst({
      where: { id: params.id, practiceId },
      include: {
        client: true,
        horse: true,
        service: true,
        practitioner: true,
        notes: { include: { author: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const json = await req.json();
    const parsed = AppointmentUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const exists = await prisma.appointment.findFirst({
      where: { id: params.id, practiceId },
      include: { client: true, horse: true, service: true, practitioner: true },
    });
    if (!exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If changing time, run conflict check
    const nextStart = parsed.data.start ? new Date(parsed.data.start) : exists.start;
    const nextEnd = parsed.data.end ? new Date(parsed.data.end) : exists.end;
    if (Number.isNaN(nextStart.valueOf()) || Number.isNaN(nextEnd.valueOf())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }
    if (nextStart >= nextEnd) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    const nextPractitionerId = parsed.data.practitionerId ?? exists.practitionerId;
    const nextClientId = parsed.data.clientId ?? exists.clientId;
    const nextServiceId = parsed.data.serviceId ?? exists.serviceId;
    const nextHorseId =
      parsed.data.horseId === null ? null : parsed.data.horseId ?? exists.horseId ?? null;

    const [practitioner, client, service, horse] = await Promise.all([
      prisma.user.findFirst({ where: { id: nextPractitionerId, practiceId } }),
      prisma.client.findFirst({ where: { id: nextClientId, practiceId }, include: { horses: true } }),
      prisma.service.findFirst({ where: { id: nextServiceId, practiceId } }),
      nextHorseId
        ? prisma.horse.findFirst({ where: { id: nextHorseId, client: { practiceId } } })
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
    if (nextHorseId && !horse) {
      return NextResponse.json({ error: 'Horse not found' }, { status: 404 });
    }

    {
      const conflict = await prisma.appointment.findFirst({
        where: {
          practiceId,
          practitionerId: nextPractitionerId,
          id: { not: exists.id },
          start: { lt: nextEnd },
          end: { gt: nextStart },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: 'Appointment conflict for practitioner' }, { status: 409 });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: exists.id },
      data: {
        status: parsed.data.status ?? exists.status,
        start: nextStart,
        end: nextEnd,
        locationText: parsed.data.locationText ?? exists.locationText,
        practitionerId: nextPractitionerId,
        clientId: nextClientId,
        horseId: nextHorseId,
        serviceId: nextServiceId,
      },
      include: { client: true, horse: true, service: true, practitioner: true, notes: true },
    });
    await recordAuditLog({
      practiceId,
      userId: getUserIdOptional(req),
      entityType: 'Appointment',
      entityId: updated.id,
      action: 'update',
      diffJSON: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
