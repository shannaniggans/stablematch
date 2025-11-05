'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface ClientOverview {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  horses: number;
  city?: string | null;
  lastSeen?: string | null;
}

interface ClientsTableProps {
  initialClients: ClientOverview[];
}

interface ClientResponse {
  items: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }>;
  total: number;
}

export function ClientsTable({ initialClients }: ClientsTableProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery<ClientResponse>({
    queryKey: ['clients', debouncedQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('query', debouncedQuery);
      const res = await fetch('/api/clients?' + params.toString());
      if (!res.ok) {
        throw new Error('Failed to load clients');
      }
      return (await res.json()) as ClientResponse;
    },
    initialData: {
      items: initialClients.map((client) => {
        const split = client.name.split(' ');
        const firstName = split[0] ?? '';
        const lastName = split.slice(1).join(' ');
        return {
          id: client.id,
          firstName,
          lastName,
          email: client.email,
          phone: client.phone,
          address: client.city ?? undefined,
        };
      }),
      total: initialClients.length,
    },
    keepPreviousData: true,
  });

  const transformed = data.items.map((client) => {
    const name = (client.firstName + ' ' + client.lastName).trim();
    return {
      id: client.id,
      name,
      email: client.email,
      phone: client.phone,
      city: client.address,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage client profiles, horses, and booking history.</p>
        </div>
        <Input
          placeholder="Search clients..."
          className="w-full max-w-xs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!isFetching && transformed.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
            {transformed.map((client) => (
              <TableRow key={client.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{client.name}</span>
                    {client.email ? <span className="text-xs text-muted-foreground">{client.email}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.phone ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{client.city ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <Link href={'/clients/' + client.id} className="text-sm font-medium text-primary hover:underline">
                    View profile
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Badge variant="outline" className="text-xs text-muted-foreground">
        {transformed.length} of {data.total} clients
      </Badge>
    </div>
  );
}
