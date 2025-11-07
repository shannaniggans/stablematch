import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TravelSlotManager } from '@/components/practitioner/travel-slot-manager';

export default async function TravelPage() {
  const user = await requireUser();

  const practitioners = await prisma.user.findMany({
    where: {
      practiceId: user.practiceId,
      role: { in: ['owner', 'practitioner', 'receptionist'] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  });

  const slots = await prisma.practitionerTravelSlot.findMany({
    where: {
      practitioner: { practiceId: user.practiceId },
      ...(user.role === 'practitioner' ? { practitionerId: user.id } : {}),
    },
    include: {
      practitioner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ start: 'asc' }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Travel schedule</CardTitle>
          <CardDescription>
            Publish where you&apos;ll be working so clients can find you and plan bookings around your travel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TravelSlotManager
            currentUserId={user.id}
            currentUserRole={user.role}
            practitioners={practitioners}
            initialSlots={slots.map((slot) => ({
              id: slot.id,
              practitionerId: slot.practitionerId,
              practitionerName: slot.practitioner?.name ?? slot.practitioner?.email ?? 'Practitioner',
              title: slot.title,
              description: slot.description,
              locationName: slot.locationName,
              latitude: slot.latitude,
              longitude: slot.longitude,
              start: slot.start.toISOString(),
              end: slot.end.toISOString(),
              isRecurring: slot.isRecurring,
              weekday: slot.weekday,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
