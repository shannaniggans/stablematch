import { notFound } from 'next/navigation';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AppointmentPageProps {
  params: { id: string };
}

const STATUS_COPY: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function AppointmentDetailPage({ params }: AppointmentPageProps) {
  const user = await requireUser();
  const appointment = await prisma.appointment.findFirst({
    where: { id: params.id, practiceId: user.practiceId },
    include: {
      client: true,
      horse: true,
      service: true,
      practitioner: true,
      notes: {
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      },
    },
  });

  if (!appointment) {
    notFound();
  }

  const practice = await prisma.practice.findUnique({ where: { id: user.practiceId } });
  const timezone = practice?.timezone ?? 'Australia/Sydney';
  const start = DateTime.fromJSDate(appointment.start).setZone(timezone);
  const end = DateTime.fromJSDate(appointment.end).setZone(timezone);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{appointment.service.name}</h1>
          <Badge variant={appointment.status === 'confirmed' ? 'success' : appointment.status === 'cancelled' ? 'destructive' : 'secondary'}>
            {STATUS_COPY[appointment.status] ?? appointment.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {start.toFormat('cccc, d LLL yyyy • h:mm a')} — {end.toFormat('h:mm a')} ({timezone})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
            <CardDescription>Contact and horse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {appointment.client.firstName} {appointment.client.lastName}
            </p>
            <p>Email: {appointment.client.email ?? '—'}</p>
            <p>Phone: {appointment.client.phone ?? '—'}</p>
            {appointment.horse ? (
              <div className="rounded-lg border bg-card/80 px-3 py-2">
                <p className="text-sm font-medium text-foreground">Horse: {appointment.horse.name}</p>
                <p className="text-xs text-muted-foreground">
                  {appointment.horse.breed ?? 'Breed unknown'} • {appointment.horse.age ? appointment.horse.age + ' yrs' : 'Age N/A'}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Practitioner</CardTitle>
            <CardDescription>Assigned professional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{appointment.practitioner.name ?? 'Team member'}</p>
            <p>Service duration: {appointment.service.durationMins} minutes</p>
            <p>Location: {appointment.locationText ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Most recent first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {appointment.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
          ) : (
            appointment.notes.map((note) => (
              <div key={note.id} className="rounded-lg border bg-card/80 px-3 py-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{note.author?.name ?? 'Team member'}</span>
                  <span>{DateTime.fromJSDate(note.createdAt).toFormat('d LLL yyyy, h:mm a')}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{note.body}</p>
                {note.isPrivate ? (
                  <Badge variant="secondary" className="mt-2 text-[10px] uppercase tracking-wide">Private</Badge>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
