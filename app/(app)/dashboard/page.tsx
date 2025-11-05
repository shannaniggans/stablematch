import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const practice = await prisma.practice.findUnique({ where: { id: user.practiceId } });
  const timezone = practice?.timezone ?? 'Australia/Sydney';
  const now = DateTime.now().setZone(timezone);
  const todayStart = now.startOf('day').toJSDate();
  const todayEnd = now.endOf('day').toJSDate();
  const upcomingWindowEnd = now.plus({ days: 7 }).endOf('day').toJSDate();

  const [todaysAppointments, upcomingAppointments, draftInvoices, activeClients, outstandingInvoices] = await Promise.all([
    prisma.appointment.count({
      where: {
        practiceId: user.practiceId,
        start: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.appointment.findMany({
      where: {
        practiceId: user.practiceId,
        start: { gte: now.toJSDate(), lte: upcomingWindowEnd },
      },
      orderBy: { start: 'asc' },
      take: 5,
      include: { client: true, service: true, practitioner: true },
    }),
    prisma.invoice.count({
      where: { practiceId: user.practiceId, status: 'draft' },
    }),
    prisma.client.count({ where: { practiceId: user.practiceId } }),
    prisma.invoice.aggregate({
      _sum: { totalCents: true },
      where: {
        practiceId: user.practiceId,
        status: { in: ['draft', 'sent'] },
      },
    }),
  ]);

  const outstandingTotal = outstandingInvoices._sum.totalCents ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {user.name ?? 'practitioner'}</h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a snapshot of your practice for {now.toLocaleString(DateTime.DATE_MED)} in {timezone}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Appointments today"
          value={todaysAppointments.toString()}
          description="Scheduled within your practice hours"
        />
        <SummaryCard
          title="Upcoming (7 days)"
          value={upcomingAppointments.length.toString()}
          description="Keep an eye on confirmation status"
        />
        <SummaryCard
          title="Outstanding"
          value={formatCurrency(outstandingTotal)}
          description="Draft and sent invoices awaiting payment"
        />
        <SummaryCard title="Active clients" value={activeClients.toString()} description="Across all practitioners" />
      </div>

      <Card className="border border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardDescription>Next seven days</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments scheduled for the next week.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {appt.service.name} for {appt.client.firstName} {appt.client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(appt.start.toISOString())} • with {appt.practitioner.name ?? 'Practitioner'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      appt.status === 'confirmed'
                        ? 'success'
                        : appt.status === 'cancelled'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {appt.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
