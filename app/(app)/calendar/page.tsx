import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateAppointmentDialog } from '@/components/appointments/create-appointment-dialog';

export default async function CalendarPage() {
  const user = await requireUser();
  const practice = await prisma.practice.findUnique({ where: { id: user.practiceId } });
  const timezone = practice?.timezone ?? 'Australia/Sydney';
  const now = DateTime.now().setZone(timezone);
  const weekStart = now.startOf('week');
  const weekEnd = weekStart.plus({ days: 6 }).endOf('day');

  const appointments = await prisma.appointment.findMany({
    where: {
      practiceId: user.practiceId,
      start: { gte: weekStart.toJSDate(), lte: weekEnd.toJSDate() },
    },
    orderBy: { start: 'asc' },
    include: { client: true, service: true, practitioner: true },
  });

  const days = Array.from({ length: 7 }).map((_, index) => weekStart.plus({ days: index }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Week overview</h1>
          <p className="text-sm text-muted-foreground">
            {weekStart.toLocaleString(DateTime.DATE_MED)} — {weekEnd.toLocaleString(DateTime.DATE_MED)} ({timezone})
          </p>
        </div>
        <CreateAppointmentDialog triggerLabel="Add appointment" afterCreatePath="/calendar" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => {
          const items = appointments.filter((appt) => DateTime.fromJSDate(appt.start).hasSame(day, 'day'));
          return (
            <Card key={day.toISODate()} className="border border-muted">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {day.toFormat('cccc')}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{day.toFormat('d LLL')}</span>
                </CardTitle>
                <CardDescription>{items.length} appointment{items.length === 1 ? '' : 's'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  items.map((appt) => (
                    <div key={appt.id} className="rounded-lg border bg-card px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{appt.service.name}</p>
                        <Badge variant={appt.status === 'confirmed' ? 'success' : 'secondary'}>{appt.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {DateTime.fromJSDate(appt.start).setZone(timezone).toFormat('h:mm a')} – {DateTime.fromJSDate(appt.end).setZone(timezone).toFormat('h:mm a')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appt.client.firstName} {appt.client.lastName} • {appt.practitioner.name ?? 'Team member'}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
