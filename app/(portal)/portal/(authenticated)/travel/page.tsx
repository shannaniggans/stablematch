import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TravelSearch } from '@/components/portal/travel-search';

export default async function PortalTravelPage() {
  const { client } = await requireClient();
  const timezone = client.practice.timezone ?? 'Australia/Sydney';

  const practitioners = await prisma.user.findMany({
    where: { practiceId: client.practiceId, role: { in: ['owner', 'practitioner', 'receptionist'] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  const upcomingSlots = await prisma.practitionerTravelSlot.findMany({
    where: {
      practitioner: { practiceId: client.practiceId },
      end: { gte: new Date() },
    },
    include: {
      practitioner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ start: 'asc' }],
    take: 50,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Travel plans</CardTitle>
        <CardDescription>Find out when practitioners will be in your area before you book.</CardDescription>
      </CardHeader>
      <CardContent>
        <TravelSearch
          practiceTimezone={timezone}
          practitioners={practitioners}
          initialResults={upcomingSlots.map((slot) => ({
            id: slot.id,
            practitionerId: slot.practitionerId,
            practitionerName: slot.practitioner?.name ?? slot.practitioner?.email ?? 'Practitioner',
            practitionerEmail: slot.practitioner?.email ?? null,
            title: slot.title,
            description: slot.description,
            locationName: slot.locationName,
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            isRecurring: slot.isRecurring,
            weekday: slot.weekday,
          }))}
        />
      </CardContent>
    </Card>
  );
}
