import Link from 'next/link';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { requireClient } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function PortalHomePage() {
  const { client } = await requireClient();
  const timezone = client.practice.timezone ?? 'Australia/Sydney';
  const now = DateTime.now().setZone(timezone);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: { clientId: client.id, start: { gte: now.toJSDate() } },
    include: { practitioner: true, service: true },
    orderBy: { start: 'asc' },
    take: 5,
  });

  const recentAppointments = await prisma.appointment.findMany({
    where: { clientId: client.id, start: { lt: now.toJSDate() } },
    include: { practitioner: true, service: true },
    orderBy: { start: 'desc' },
    take: 5,
  });

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
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border border-primary/20">
          <CardHeader>
            <CardTitle>Next appointments</CardTitle>
            <CardDescription>Your upcoming bookings with FullStride practitioners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{appt.service?.name ?? 'Session'}</span>
                    <Badge variant="secondary">{DateTime.fromJSDate(appt.start).setZone(timezone).toFormat('d LLL')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {DateTime.fromJSDate(appt.start).setZone(timezone).toFormat('ccc, h:mm a')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appt.practitioner?.name ?? 'FullStride Practitioner'}
                  </p>
                </div>
              ))
            )}
            <Link href="/portal/horses" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Update horse details
            </Link>
            <Link href="/portal/tack" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Open my tack room
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sharing status</CardTitle>
            <CardDescription>Control which practitioners can view your profile and horse information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <p className="text-sm font-medium text-foreground">Profile sharing</p>
              <p className="text-xs text-muted-foreground">
                {client.shareProfileWithPractitioners
                  ? 'Your profile is shared with FullStride practitioners by default.'
                  : 'Your profile is hidden until you grant access to a practitioner.'}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <p className="text-sm font-medium text-foreground">Horse information</p>
              <p className="text-xs text-muted-foreground">
                {client.shareHorsesWithPractitioners
                  ? 'Horse records are available to practitioners for upcoming appointments.'
                  : 'Horse information remains private unless you share it.'}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 px-3 py-2">
              <p className="text-sm font-medium text-foreground">Direct shares</p>
              {client.shares.length === 0 ? (
                <p className="text-xs text-muted-foreground">No direct sharing preferences set.</p>
              ) : (
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {client.shares.map((share) => (
                    <li key={share.practitionerId}>
                      {share.practitioner.name ?? share.practitioner.email ?? 'Practitioner'} • profile:{' '}
                      {share.shareProfile ? 'on' : 'off'}, horses: {share.shareHorses ? 'on' : 'off'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link href="/portal/sharing" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
              Manage sharing preferences
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent visits</CardTitle>
            <CardDescription>Your last sessions with FullStride.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No past appointments yet.</p>
            ) : (
              recentAppointments.map((appt) => (
                <div key={appt.id} className="rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{appt.service?.name ?? 'Session'}</span>
                    <Badge variant="outline">
                      {DateTime.fromJSDate(appt.start).setZone(timezone).toFormat('d LLL yyyy')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {DateTime.fromJSDate(appt.start).setZone(timezone).toFormat('ccc, h:mm a')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appt.practitioner?.name ?? 'FullStride Practitioner'}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Practitioners you&apos;ve seen</CardTitle>
            <CardDescription>Quick access to your FullStride care team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {practitioners.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have not met any practitioners yet.</p>
            ) : (
              practitioners.map((practitioner) => (
                <div key={practitioner.id} className="flex flex-col rounded-lg border bg-card px-3 py-2">
                  <span className="text-sm font-medium text-foreground">
                    {practitioner.name ?? 'FullStride Practitioner'}
                  </span>
                  <span className="text-xs text-muted-foreground">{practitioner.email ?? 'Email on file'}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
