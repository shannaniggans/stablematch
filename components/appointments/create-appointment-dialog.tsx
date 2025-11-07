'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';

interface ClientItem {
  id: string;
  name: string;
  email?: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  durationMins: number;
}

interface PractitionerItem {
  id: string;
  name: string | null;
  email: string | null;
}

function useClients(enabled: boolean) {
  return useQuery<{ items: Array<{ id: string; firstName: string; lastName: string; email?: string | null }> }>({
    queryKey: ['clients', 'appointment'],
    enabled,
    queryFn: async () => {
      const res = await fetch('/api/clients?pageSize=200');
      if (!res.ok) throw new Error('Unable to load clients');
      return res.json();
    },
  });
}

function useServices(enabled: boolean) {
  return useQuery<{ items: Array<{ id: string; name: string; durationMins: number }> }>({
    queryKey: ['services', 'appointment'],
    enabled,
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Unable to load services');
      return res.json();
    },
  });
}

function usePractitioners(enabled: boolean) {
  return useQuery<{ items: PractitionerItem[] }>({
    queryKey: ['practitioners', 'appointment'],
    enabled,
    queryFn: async () => {
      const res = await fetch('/api/users?role=practitioner');
      if (!res.ok) throw new Error('Unable to load practitioners');
      return res.json();
    },
  });
}

const INITIAL_CLIENT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
};

interface CreateAppointmentDialogProps {
  triggerLabel?: string;
  triggerClassName?: string;
  afterCreatePath?: string;
  onCreated?: (appointment: { id: string }) => void;
}

export function CreateAppointmentDialog({
  triggerLabel = 'New appointment',
  triggerClassName,
  afterCreatePath,
  onCreated,
}: CreateAppointmentDialogProps = {}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [practitionerId, setPractitionerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 16));
  const [end, setEnd] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [locationText, setLocationText] = useState('');
  const [notes, setNotes] = useState('');
  const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<{ id: string } | null>(null);

  const clientsQuery = useClients(open);
  const servicesQuery = useServices(open);
  const practitionersQuery = usePractitioners(open);

  const router = useRouter();
  const queryClient = useQueryClient();

  const clientOptions: ClientItem[] = useMemo(() => {
    return (clientsQuery.data?.items ?? []).map((client) => ({
      id: client.id,
      name: [client.firstName, client.lastName].filter(Boolean).join(' ').trim(),
      email: client.email,
    }));
  }, [clientsQuery.data?.items]);

  const serviceOptions: ServiceItem[] = useMemo(
    () => servicesQuery.data?.items ?? [],
    [servicesQuery.data?.items],
  );

  const practitionerOptions: PractitionerItem[] = useMemo(
    () => practitionersQuery.data?.items ?? [],
    [practitionersQuery.data?.items],
  );

  const travelHintQuery = useQuery<
    | {
        title: string;
        locationName: string;
        start: string;
        end: string;
      }
    | null
  >({
    queryKey: ['travel-hint', practitionerId, start],
    enabled: Boolean(practitionerId && start),
    queryFn: async () => {
      if (!practitionerId || !start) return null;
      const startDate = new Date(start);
      if (Number.isNaN(startDate.valueOf())) return null;
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(startDate);
      rangeEnd.setHours(23, 59, 59, 999);
      const params = new URLSearchParams({
        practitionerId,
        from: rangeStart.toISOString(),
        to: rangeEnd.toISOString(),
      });
      const res = await fetch('/api/travel/search?' + params.toString(), { cache: 'no-store' });
      if (!res.ok) {
        return null;
      }
      const payload = await res.json();
      const firstMatch = (payload.items ?? []).find((item: any) => {
        const slotStart = new Date(item.start).getTime();
        const slotEnd = new Date(item.end).getTime();
        const target = startDate.getTime();
        return target >= slotStart && target <= slotEnd;
      });
      if (!firstMatch) {
        return null;
      }
      return {
        title: firstMatch.title,
        locationName: firstMatch.locationName,
        start: firstMatch.start,
        end: firstMatch.end,
      };
    },
  });

  useEffect(() => {
    if (!open) {
      setMode('existing');
      setSelectedClientId('');
      setPractitionerId('');
      setServiceId('');
      const now = new Date();
      setStart(now.toISOString().slice(0, 16));
      setEnd(new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16));
      setLocationText('');
      setNotes('');
      setClientForm(INITIAL_CLIENT_FORM);
      setError(null);
      setSubmitting(false);
      setCreatedAppointment(null);
    }
  }, [open]);

  useEffect(() => {
    if (!start || !serviceId) return;
    const svc = serviceOptions.find((item) => item.id === serviceId);
    if (!svc) return;
    const startDate = new Date(start);
    const newEnd = new Date(startDate.getTime() + svc.durationMins * 60 * 1000);
    setEnd(newEnd.toISOString().slice(0, 16));
  }, [start, serviceId, serviceOptions]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createdAppointment) {
      setError('Appointment already created. Close this dialog to start another booking.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      let clientId = selectedClientId;
      if (mode === 'new') {
        const body = {
          firstName: clientForm.firstName.trim(),
          lastName: clientForm.lastName.trim(),
          email: clientForm.email.trim() || undefined,
          phone: clientForm.phone.trim() || undefined,
          address: clientForm.address.trim() || undefined,
        };
        if (!body.firstName || !body.lastName) {
          throw new Error('First and last name are required for new clients.');
        }
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error ?? 'Unable to create client');
        }
        const createdClient = await res.json();
        clientId = createdClient.id;
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      } else if (!clientId) {
        throw new Error('Select a client or create a new one.');
      }

      if (!practitionerId) throw new Error('Select a practitioner.');
      if (!serviceId) throw new Error('Select a service.');
      if (!start || !end) throw new Error('Provide start and end times.');

      const payload = {
        practitionerId,
        clientId,
        serviceId,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        locationText: locationText.trim() || undefined,
      };

      const apptRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!apptRes.ok) {
        const payloadError = await apptRes.json().catch(() => ({}));
        throw new Error(payloadError.error ?? 'Unable to create appointment');
      }
      const created = await apptRes.json();
      setCreatedAppointment(created);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onCreated?.(created);

      const noteBody = notes.trim();
      if (noteBody) {
        const noteRes = await fetch(`/api/appointments/${created.id}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: noteBody }),
        });
        if (!noteRes.ok) {
          const payloadError = await noteRes.json().catch(() => ({}));
          setError(
            payloadError.error ??
              'Appointment saved, but note could not be saved. You can add it from the appointment page.',
          );
          setSubmitting(false);
          router.refresh();
          return;
        }
      }

      setSubmitting(false);
      if (afterCreatePath) {
        router.replace(afterCreatePath);
      }
      router.refresh();
      setOpen(false);
    } catch (err: any) {
      setError(err.message ?? 'Could not create appointment');
      setSubmitting(false);
    }
  };

  const queriesLoading =
    clientsQuery.isLoading || servicesQuery.isLoading || practitionersQuery.isLoading;
  const disableFields = submitting || queriesLoading || Boolean(createdAppointment);
  const disableSubmit = submitting || queriesLoading || Boolean(createdAppointment);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={['w-full sm:w-auto', triggerClassName].filter(Boolean).join(' ')}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create appointment</DialogTitle>
          <DialogDescription>Book a session and optionally add the client on the fly.</DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Client</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === 'existing' ? 'secondary' : 'ghost'}
                  onClick={() => setMode('existing')}
                  disabled={disableFields}
                >
                  Existing
                </Button>
                <Button
                  type="button"
                  variant={mode === 'new' ? 'secondary' : 'ghost'}
                  onClick={() => setMode('new')}
                  disabled={disableFields}
                >
                  New client
                </Button>
              </div>
              {mode === 'existing' ? (
                <Select disabled={disableFields} value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={clientsQuery.isLoading ? 'Loading clients…' : 'Select client'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.email ? ' – ' + client.email : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="First name"
                      value={clientForm.firstName}
                      onChange={(event) => setClientForm((prev) => ({ ...prev, firstName: event.target.value }))}
                      disabled={disableFields}
                      required
                    />
                    <Input
                      placeholder="Last name"
                      value={clientForm.lastName}
                      onChange={(event) => setClientForm((prev) => ({ ...prev, lastName: event.target.value }))}
                      disabled={disableFields}
                      required
                    />
                  </div>
                  <Input
                    placeholder="Email"
                    type="email"
                    value={clientForm.email}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, email: event.target.value }))}
                    disabled={disableFields}
                  />
                  <Input
                    placeholder="Phone"
                    value={clientForm.phone}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, phone: event.target.value }))}
                    disabled={disableFields}
                  />
                  <Textarea
                    placeholder="Address"
                    value={clientForm.address}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, address: event.target.value }))}
                    disabled={disableFields}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="practitioner">
                Practitioner
              </label>
              <Select disabled={disableFields} value={practitionerId} onValueChange={setPractitionerId}>
                <SelectTrigger id="practitioner">
                  <SelectValue placeholder={practitionersQuery.isLoading ? 'Loading team…' : 'Select practitioner'} />
                </SelectTrigger>
                <SelectContent>
                  {practitionerOptions.map((pract) => (
                    <SelectItem key={pract.id} value={pract.id}>
                      {pract.name ?? pract.email ?? 'Team member'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="service">
                Service
              </label>
              <Select disabled={disableFields} value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger id="service">
                  <SelectValue placeholder={servicesQuery.isLoading ? 'Loading services…' : 'Select service'} />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.durationMins} mins)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="start">
                  Start
                </label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  disabled={disableFields}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="end">
                  End
                </label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  disabled={disableFields}
                  required
                />
              </div>
            </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="location">
              Location (optional)
            </label>
            <Input
                id="location"
                placeholder="On-site, clinic, etc."
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                disabled={disableFields}
              />
              {travelHintQuery.data ? (
                <p className="text-xs text-primary">
                  Travel plan: {travelHintQuery.data.title} at {travelHintQuery.data.locationName} (
                  {formatDateTime(travelHintQuery.data.start)} – {formatDateTime(travelHintQuery.data.end)})
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="notes">
                Internal notes (optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add appointment context"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={disableFields}
              />
            </div>
          </div>
          {error ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {createdAppointment ? (
                <Link
                  href={`/appointments/${createdAppointment.id}`}
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Open appointment record
                </Link>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {submitting ? 'Saving…' : 'Create appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
