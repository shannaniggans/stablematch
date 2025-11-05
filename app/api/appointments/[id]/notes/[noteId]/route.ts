import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPracticeId, getUserId } from '@/lib/tenancy';
import { NoteUpdateSchema } from '@/lib/validation/note';
import { recordAuditLog } from '@/lib/server/audit';

interface Params {
  params: { id: string; noteId: string };
}

async function ensureNote(practiceId: string, appointmentId: string, noteId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId, appointmentId, appointment: { practiceId } },
  });
  if (!note) {
    throw new Error('Note not found');
  }
  return note;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserId(req);
    const json = await req.json();
    const parsed = NoteUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 });
    }
    const note = await ensureNote(practiceId, params.id, params.noteId);
    if (note.authorId !== userId) {
      return NextResponse.json({ error: 'Only author can edit note' }, { status: 403 });
    }
    const updated = await prisma.note.update({
      where: { id: note.id },
      data: parsed.data,
      include: { author: true },
    });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Note',
      entityId: updated.id,
      action: 'update',
      diffJSON: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'Note not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const practiceId = getPracticeId(req);
    const userId = getUserId(req);
    const note = await ensureNote(practiceId, params.id, params.noteId);
    if (note.authorId !== userId) {
      return NextResponse.json({ error: 'Only author can delete note' }, { status: 403 });
    }
    await prisma.note.delete({ where: { id: note.id } });
    await recordAuditLog({
      practiceId,
      userId,
      entityType: 'Note',
      entityId: note.id,
      action: 'delete',
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'Note not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
