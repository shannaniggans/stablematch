import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserId } from '@/lib/tenancy';
import { NoteCreateSchema } from '@/lib/validation/note';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const appointment = await prisma.appointment.findFirst({
      where: { id: params.id, practiceId },
      include: { notes: { orderBy: { createdAt: 'desc' }, include: { author: true } } },
    });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json({ items: appointment.notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserId(req);
    const json = await req.json();
    const parsed = NoteCreateSchema.safeParse({ ...json, appointmentId: params.id });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const appointment = await prisma.appointment.findFirst({
      where: { id: parsed.data.appointmentId, practiceId },
    });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    const user = await prisma.user.findFirst({ where: { id: userId, practiceId } });
    if (!user) {
      return NextResponse.json({ error: 'User not in practice' }, { status: 403 });
    }
    const note = await prisma.note.create({
      data: {
        appointmentId: appointment.id,
        authorId: user.id,
        body: parsed.data.body,
        isPrivate: parsed.data.isPrivate ?? true,
      },
      include: { author: true },
    });
    await recordAuditLog({
      practiceId,
      userId: user.id,
      entityType: 'Note',
      entityId: note.id,
      action: 'create',
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
