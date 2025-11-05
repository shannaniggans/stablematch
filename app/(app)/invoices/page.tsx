import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/utils';
import { InvoicesTable, InvoiceOverview } from '@/components/invoices/invoices-table';

export default async function InvoicesPage() {
  const user = await requireUser();
  const invoices = await prisma.invoice.findMany({
    where: { practiceId: user.practiceId },
    orderBy: { issuedAt: 'desc' },
    take: 20,
    include: { client: true },
  });

  const initialInvoices: InvoiceOverview[] = invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    clientName: (invoice.client.firstName + ' ' + invoice.client.lastName).trim(),
    issuedAt: invoice.issuedAt.toISOString(),
    totalCents: invoice.totalCents,
    status: invoice.status,
  }));

  return <InvoicesTable initialInvoices={initialInvoices} />;
}
