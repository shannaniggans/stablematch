import Link from 'next/link';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

export default async function AppointmentsPage() {
  const user = await requireUser();
  const practice = await prisma.practice.findUnique({ where: { id: user.practiceId } });
  const timezone = practice?.timezone ?? 'Australia/Sydney';
  const now = DateTime.now().setZone(timezone);

  const [upcoming, recent] = await Promise.all([
    prisma.appointment.findMany({
      where: { practiceId: user.practiceId, start: { gte: now.toJSDate() } },
      orderBy: { start: 'asc' },
      take: 10,
      include: { client: true, service: true, practitioner: true },
    }),
    prisma.appointment.findMany({
      where: { practiceId: user.practiceId, start: { lt: now.toJSDate() } },
      orderBy: { start: 'desc' },
      take: 10,
      include: { client: true, service: true, practitioner: true },
    }),
  ]);

  function renderList(items: typeof upcoming, emptyLabel: string) {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    return (
      <div className="space-y-3">
        {items.map((appt) => (
          <Link
            key={appt.id}
            href={'/appointments/' + appt.id}
            className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-2 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{appt.service.name}</span>
              <Badge variant={appt.status === 'confirmed' ? 'success' : appt.status === 'cancelled' ? 'destructive' : 'secondary'}>
                {appt.status}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(appt.start.toISOString())} • {appt.client.firstName} {appt.client.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{appt.practitioner.name ?? 'Team member'}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Appointments</h1>
        <p className="text-sm text-muted-foreground">Review upcoming sessions and revisit recent outcomes.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-primary/20">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Next booked sessions</CardDescription>
          </CardHeader>
          <CardContent>{renderList(upcoming, 'No upcoming appointments on the calendar.')}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent</CardTitle>
            <CardDescription>Most recent visits</CardDescription>
          </CardHeader>
          <CardContent>{renderList(recent, 'No recent appointments recorded.')}</CardContent>
        </Card>
      </div>
    </div>
  );
}
