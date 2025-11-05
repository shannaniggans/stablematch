'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export interface InvoiceOverview {
  id: string;
  number: string;
  clientName: string;
  issuedAt: string;
  totalCents: number;
  status: 'draft' | 'sent' | 'paid' | 'void';
}

interface InvoicesTableProps {
  initialInvoices: InvoiceOverview[];
}

interface InvoiceResponse {
  items: Array<{
    id: string;
    number: string;
    issuedAt: string;
    status: 'draft' | 'sent' | 'paid' | 'void';
    totalCents: number;
    client: { firstName: string; lastName: string };
  }>;
}

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'paid', 'void'] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All statuses',
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  void: 'Void',
};

export function InvoicesTable({ initialInvoices }: InvoicesTableProps) {
  const [status, setStatus] = useState<StatusFilter>('all');

  const { data, isFetching } = useQuery<InvoiceResponse>({
    queryKey: ['invoices', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      const res = await fetch('/api/invoices?' + params.toString());
      if (!res.ok) {
        throw new Error('Failed to load invoices');
      }
      return (await res.json()) as InvoiceResponse;
    },
    initialData: {
      items: initialInvoices.map((invoice) => {
        const parts = invoice.clientName.split(' ');
        return {
          id: invoice.id,
          number: invoice.number,
          issuedAt: invoice.issuedAt,
          status: invoice.status,
          totalCents: invoice.totalCents,
          client: {
            firstName: parts[0] ?? '',
            lastName: parts.slice(1).join(' '),
          },
        };
      }),
    },
    keepPreviousData: true,
  });

  const rows = data.items.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    status: invoice.status,
    total: formatCurrency(invoice.totalCents),
    clientName: (invoice.client.firstName + ' ' + invoice.client.lastName).trim(),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Track billing status and download PDF copies.</p>
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!isFetching && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  No invoices match this filter.
                </TableCell>
              </TableRow>
            )}
            {rows.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-primary/5">
                <TableCell className="font-medium text-foreground">{invoice.number}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{invoice.clientName}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(invoice.issuedAt)}</TableCell>
                <TableCell className="text-right font-medium text-foreground">{invoice.total}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={'/invoices/' + invoice.id} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                    <Button variant="outline" size="sm" asChild>
                      <a href={'/api/invoices/' + invoice.id + '/pdf'} target="_blank" rel="noopener noreferrer">
                        PDF
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
