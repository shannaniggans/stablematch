import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ClientPortalRegisterSchema } from '@/lib/validation/portal';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ClientPortalRegisterSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const {
      practiceId,
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      notes,
      shareProfileWithPractitioners,
      shareHorsesWithPractitioners,
    } = parsed.data;

    const practice = await prisma.practice.findUnique({ where: { id: practiceId } });
    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const existingClient = await prisma.client.findFirst({
      where: { practiceId, email: normalizedEmail },
    });
    if (existingClient?.userId) {
      return NextResponse.json({ error: 'This client has already registered.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: `${firstName} ${lastName}`.trim(),
        role: 'client',
        practiceId,
        passwordHash,
      },
    });

    if (existingClient) {
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          address,
          notes,
          email: normalizedEmail,
          shareProfileWithPractitioners: shareProfileWithPractitioners ?? existingClient.shareProfileWithPractitioners,
          shareHorsesWithPractitioners: shareHorsesWithPractitioners ?? existingClient.shareHorsesWithPractitioners,
        },
      });
    } else {
      await prisma.client.create({
        data: {
          practiceId,
          userId: user.id,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          address,
          notes,
          shareProfileWithPractitioners: shareProfileWithPractitioners ?? false,
          shareHorsesWithPractitioners: shareHorsesWithPractitioners ?? false,
        },
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to register client' }, { status: 500 });
  }
}
