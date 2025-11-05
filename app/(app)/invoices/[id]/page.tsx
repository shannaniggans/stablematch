import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { CheckoutButton } from '@/components/invoices/checkout-button';

interface InvoicePageProps {
  params: { id: string };
}

export default async function InvoiceDetailPage({ params }: InvoicePageProps) {
  const user = await requireUser();
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, practiceId: user.practiceId },
    include: {
      client: true,
      items: true,
      payments: { orderBy: { paidAt: 'desc' } },
      practice: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{invoice.number}</h1>
          <p className="text-sm text-muted-foreground">Issued {formatDateTime(invoice.issuedAt.toISOString())} to {invoice.client.firstName} {invoice.client.lastName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              invoice.status === 'paid'
                ? 'success'
                : invoice.status === 'void'
                ? 'secondary'
                : 'outline'
            }
          >
            {invoice.status}
          </Badge>
          <Button asChild variant="outline">
            <a href={'/api/invoices/' + invoice.id + '/pdf'} target="_blank" rel="noopener noreferrer">
              Download PDF
            </a>
          </Button>
          {invoice.status !== 'paid' ? <CheckoutButton invoiceId={invoice.id} /> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Services and rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPriceCents)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPriceCents * item.qty)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Totals and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(invoice.subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span className="font-medium text-foreground">{formatCurrency(invoice.taxCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold text-foreground">
              <span>Total due</span>
              <span>{formatCurrency(invoice.totalCents)}</span>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Practice: {invoice.practice.name}</p>
              <p>Timezone: {invoice.practice.timezone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Recorded transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            invoice.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border bg-card/80 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(payment.amountCents)}</p>
                  <p className="text-xs text-muted-foreground">{payment.method}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(payment.paidAt.toISOString())}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
