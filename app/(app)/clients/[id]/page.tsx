import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface ClientPageProps {
  params: { id: string };
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const user = await requireUser();
  const client = await prisma.client.findFirst({
    where: { id: params.id, practiceId: user.practiceId },
    include: {
      horses: true,
      appts: {
        orderBy: { start: 'desc' },
        take: 5,
        include: { service: true, practitioner: true },
      },
      invoices: {
        orderBy: { issuedAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          {client.firstName} {client.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">Client overview, latest sessions, and invoices.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Primary details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Email:</span> {client.email ?? '—'}</p>
            <p><span className="font-medium text-foreground">Phone:</span> {client.phone ?? '—'}</p>
            <p><span className="font-medium text-foreground">Address:</span> {client.address ?? '—'}</p>
            <p><span className="font-medium text-foreground">Notes:</span> {client.notes ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horses</CardTitle>
            <CardDescription>{client.horses.length} active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.horses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No horses recorded yet.</p>
            ) : (
              client.horses.map((horse) => (
                <div key={horse.id} className="rounded-lg border bg-card px-3 py-2">
                  <p className="font-medium text-foreground">{horse.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {horse.breed ?? 'Breed unknown'} • {horse.age ? horse.age + ' yrs' : 'Age N/A'}
                  </p>
                  {horse.notes ? <p className="mt-1 text-xs text-muted-foreground">{horse.notes}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-primary/10">
          <CardHeader>
            <CardTitle>Recent appointments</CardTitle>
            <CardDescription>Last five visits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.appts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments on record.</p>
            ) : (
              client.appts.map((appt) => (
                <div key={appt.id} className="rounded-lg border bg-card px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{appt.service.name}</p>
                    <Badge variant={appt.status === 'completed' ? 'success' : 'secondary'}>{appt.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(appt.start.toISOString())} • {appt.practitioner.name ?? 'Team member'}
                  </p>
                  {appt.locationText ? (
                    <p className="text-xs text-muted-foreground">{appt.locationText}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-primary/10">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Most recent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              client.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued {formatDateTime(invoice.issuedAt.toISOString())}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'void' ? 'secondary' : 'outline'}>
                      {invoice.status}
                    </Badge>
                    <p className="text-sm font-medium text-foreground">{formatCurrency(invoice.totalCents)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
