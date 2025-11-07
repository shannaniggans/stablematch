import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { ClientPortalProfileUpdateSchema } from '@/lib/validation/portal';

export async function GET() {
  try {
    const { client } = await requireClient();
    const practitioners = await prisma.appointment.findMany({
      where: { clientId: client.id },
      include: { practitioner: true },
      distinct: ['practitionerId'],
    });
    return NextResponse.json({
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes,
        shareProfileWithPractitioners: client.shareProfileWithPractitioners,
        shareHorsesWithPractitioners: client.shareHorsesWithPractitioners,
      },
      practice: {
        id: client.practiceId,
        name: client.practice.name,
        timezone: client.practice.timezone,
      },
      shareOverrides: client.shares.map((share) => ({
        practitionerId: share.practitionerId,
        shareProfile: share.shareProfile,
        shareHorses: share.shareHorses,
        practitioner: {
          id: share.practitioner.id,
          name: share.practitioner.name,
          email: share.practitioner.email,
        },
      })),
      practitioners: practitioners
        .map((appt) => appt.practitioner)
        .filter((user): user is NonNullable<typeof user> => Boolean(user))
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to load profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { client } = await requireClient();
    const json = await req.json();
    const parsed = ClientPortalProfileUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const data = parsed.data;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: {
        firstName: data.firstName ?? client.firstName,
        lastName: data.lastName ?? client.lastName,
        email: data.email?.toLowerCase() ?? client.email,
        phone: data.phone ?? client.phone,
        address: data.address ?? client.address,
        notes: data.notes ?? client.notes,
        shareProfileWithPractitioners:
          data.shareProfileWithPractitioners ?? client.shareProfileWithPractitioners,
        shareHorsesWithPractitioners:
          data.shareHorsesWithPractitioners ?? client.shareHorsesWithPractitioners,
      },
      include: {
        practice: true,
        shares: {
          include: {
            practitioner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (data.email) {
      await prisma.user.update({
        where: { id: client.userId! },
        data: { email: data.email.toLowerCase() },
      });
    }

    return NextResponse.json({
      client: {
        id: updatedClient.id,
        firstName: updatedClient.firstName,
        lastName: updatedClient.lastName,
        email: updatedClient.email,
        phone: updatedClient.phone,
        address: updatedClient.address,
        notes: updatedClient.notes,
        shareProfileWithPractitioners: updatedClient.shareProfileWithPractitioners,
        shareHorsesWithPractitioners: updatedClient.shareHorsesWithPractitioners,
      },
      practice: {
        id: updatedClient.practiceId,
        name: updatedClient.practice.name,
        timezone: updatedClient.practice.timezone,
      },
      shareOverrides: updatedClient.shares.map((share) => ({
        practitionerId: share.practitionerId,
        shareProfile: share.shareProfile,
        shareHorses: share.shareHorses,
        practitioner: share.practitioner,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Unable to update profile' }, { status: 500 });
  }
}
