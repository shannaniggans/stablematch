import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { ClientPortalShareUpdateSchema } from '@/lib/validation/portal';

export async function GET() {
  try {
    const { client } = await requireClient();
    const shares = await prisma.clientPractitionerShare.findMany({
      where: { clientId: client.id },
      include: {
        practitioner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      items: shares.map((share) => ({
        practitionerId: share.practitionerId,
        shareProfile: share.shareProfile,
        shareHorses: share.shareHorses,
        practitioner: share.practitioner,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to load sharing preferences' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { client } = await requireClient();
    const json = await req.json();
    const parsed = ClientPortalShareUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const items = parsed.data.items;
    const practitionerIds = [...new Set(items.map((item) => item.practitionerId))];
    if (practitionerIds.length === 0) {
      await prisma.clientPractitionerShare.deleteMany({ where: { clientId: client.id } });
      return NextResponse.json({ items: [] });
    }

    const practitioners = await prisma.user.findMany({
      where: {
        id: { in: practitionerIds },
        practiceId: client.practiceId,
      },
      select: { id: true },
    });
    const validIds = new Set(practitioners.map((p) => p.id));
    const invalid = practitionerIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      return NextResponse.json({ error: 'Invalid practitioner selection' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.clientPractitionerShare.deleteMany({
        where: {
          clientId: client.id,
          practitionerId: { notIn: practitionerIds },
        },
      });

      for (const item of items) {
        await tx.clientPractitionerShare.upsert({
          where: {
            clientId_practitionerId: {
              clientId: client.id,
              practitionerId: item.practitionerId,
            },
          },
          update: {
            shareProfile: item.shareProfile,
            shareHorses: item.shareHorses,
          },
          create: {
            clientId: client.id,
            practitionerId: item.practitionerId,
            shareProfile: item.shareProfile,
            shareHorses: item.shareHorses,
          },
        });
      }
    });

    const updated = await prisma.clientPractitionerShare.findMany({
      where: { clientId: client.id },
      include: {
        practitioner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      items: updated.map((share) => ({
        practitionerId: share.practitionerId,
        shareProfile: share.shareProfile,
        shareHorses: share.shareHorses,
        practitioner: share.practitioner,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to update sharing preferences' }, { status: 500 });
  }
}
