import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientShareSettings } from '@/components/portal/client-share-settings';

export default async function PortalSharingPage() {
  const { client } = await requireClient();
  const practitionerUsage = await prisma.appointment.findMany({
    where: { clientId: client.id },
    include: { practitioner: true },
    distinct: ['practitionerId'],
    orderBy: { start: 'desc' },
  });
  const practitioners = practitionerUsage
    .map((appt) => appt.practitioner)
    .filter((user): user is NonNullable<typeof user> => Boolean(user));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sharing preferences</CardTitle>
        <CardDescription>
          Decide which practitioners can see your profile and horse information. These settings override your default sharing
          preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClientShareSettings
          practitioners={practitioners.map((practitioner) => ({
            id: practitioner.id,
            name: practitioner.name,
            email: practitioner.email,
          }))}
          defaults={{
            shareProfileWithPractitioners: client.shareProfileWithPractitioners,
            shareHorsesWithPractitioners: client.shareHorsesWithPractitioners,
          }}
          initialOverrides={client.shares.map((share) => ({
            practitionerId: share.practitionerId,
            shareProfile: share.shareProfile,
            shareHorses: share.shareHorses,
          }))}
        />
      </CardContent>
    </Card>
  );
}
