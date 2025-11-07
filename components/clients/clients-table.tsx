'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            placeholder="Search clients..."
            className="w-full max-w-xs"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <CreateClientDialog
            onCreated={() => {
              setQuery('');
              setDebouncedQuery('');
            }}
          />
        </div>
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

interface CreateClientDialogProps {
  onCreated?: () => void;
}

const createEmptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
});

function CreateClientDialog({ onCreated }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(createEmptyForm);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: ReturnType<typeof createEmptyForm>) => {
      const body = {
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim() || undefined,
        phone: payload.phone.trim() || undefined,
        address: payload.address.trim() || undefined,
        notes: payload.notes.trim() || undefined,
      };
      if (!body.firstName || !body.lastName) {
        throw new Error('First and last name are required.');
      }
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payloadError = await res.json().catch(() => ({}));
        throw new Error(payloadError.error ?? 'Unable to create client');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setOpen(false);
      setForm(createEmptyForm());
      setError(null);
      onCreated?.();
    },
    onError: (err: any) => {
      setError(err.message ?? 'Unable to create client');
    },
  });

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setForm(createEmptyForm());
      setError(null);
      mutation.reset();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">New client</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
          <DialogDescription>Create a client profile that can be used for future bookings.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="First name"
              required
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              disabled={mutation.isPending}
            />
            <Input
              placeholder="Last name"
              required
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              disabled={mutation.isPending}
            />
          </div>
          <Input
            placeholder="Email (optional)"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            disabled={mutation.isPending}
          />
          <Input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            disabled={mutation.isPending}
          />
          <Textarea
            placeholder="Address (optional)"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            disabled={mutation.isPending}
          />
          <Textarea
            placeholder="Internal notes (optional)"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            disabled={mutation.isPending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Create client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
