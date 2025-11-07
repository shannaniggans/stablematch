'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PractitionerOption {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

interface TravelSlotSummary {
  id: string;
  practitionerId: string;
  practitionerName: string;
  title: string;
  description?: string | null;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  start: string;
  end: string;
  isRecurring: boolean;
  weekday: number | null;
}

interface TravelSlotManagerProps {
  currentUserId: string;
  currentUserRole: string;
  practitioners: PractitionerOption[];
  initialSlots: TravelSlotSummary[];
}

interface TravelSlotFormState {
  practitionerId: string;
  title: string;
  description: string;
  locationName: string;
  latitude: string;
  longitude: string;
  start: string;
  end: string;
  isRecurring: boolean;
  weekday: string;
}

const weekDayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const weekdayLabel = (weekday: number | null) => {
  const item = weekDayOptions.find((option) => Number(option.value) === weekday);
  return item?.label ?? '';
};

function createEmptyForm(practitionerId: string): TravelSlotFormState {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    practitionerId,
    title: '',
    description: '',
    locationName: '',
    latitude: '',
    longitude: '',
    start: now.toISOString().slice(0, 16),
    end: inTwoHours.toISOString().slice(0, 16),
    isRecurring: false,
    weekday: String(now.getDay()),
  };
}

async function fetchSlots(): Promise<TravelSlotSummary[]> {
  const res = await fetch('/api/travel/slots');
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Unable to fetch travel slots');
  }
  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    id: item.id,
    practitionerId: item.practitionerId,
    practitionerName: item.practitionerName ?? '',
    title: item.title,
    description: item.description,
    locationName: item.locationName,
    latitude: item.latitude,
    longitude: item.longitude,
    start: new Date(item.start).toISOString(),
    end: new Date(item.end).toISOString(),
    isRecurring: item.isRecurring,
    weekday: item.weekday,
  }));
}

function resolveDefaultPractitionerId(practitioners: PractitionerOption[], fallbackId: string) {
  return practitioners[0]?.id ?? fallbackId;
}

export function TravelSlotManager({ currentUserId, currentUserRole, practitioners, initialSlots }: TravelSlotManagerProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<TravelSlotFormState | null>(null);
  const [editingSlot, setEditingSlot] = useState<TravelSlotSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const slotsQuery = useQuery<TravelSlotSummary[]>({
    queryKey: ['travel-slots'],
    queryFn: fetchSlots,
    initialData: initialSlots,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/travel/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to create travel slot');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel-slots'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/travel/slots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to update travel slot');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel-slots'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/travel/slots/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to delete travel slot');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel-slots'] });
    },
  });

  const canAssignPractitioner = currentUserRole !== 'practitioner';

  function resolveInitialPractitionerId() {
    if (canAssignPractitioner) {
      return resolveDefaultPractitionerId(practitioners, currentUserId);
    }
    const match = practitioners.find((practitioner) => practitioner.id === currentUserId);
    return match?.id ?? currentUserId;
  }

  function openCreateDialog() {
    setActiveForm(createEmptyForm(resolveInitialPractitionerId()));
    setCreateOpen(true);
    setMessage(null);
  }

  function resetDialog() {
    setActiveForm(null);
    setEditingSlot(null);
    setCreateOpen(false);
    setMessage(null);
  }

  function handleEdit(slot: TravelSlotSummary) {
    setEditingSlot(slot);
    setActiveForm({
      practitionerId: slot.practitionerId,
      title: slot.title,
      description: slot.description ?? '',
      locationName: slot.locationName,
      latitude: slot.latitude != null ? String(slot.latitude) : '',
      longitude: slot.longitude != null ? String(slot.longitude) : '',
      start: slot.start.slice(0, 16),
      end: slot.end.slice(0, 16),
      isRecurring: slot.isRecurring,
      weekday: slot.weekday != null ? String(slot.weekday) : String(new Date(slot.start).getDay()),
    });
    setCreateOpen(true);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeForm) return;
    setMessage(null);

    const payload: Record<string, any> = {
      title: activeForm.title,
      description: activeForm.description || undefined,
      locationName: activeForm.locationName,
      start: new Date(activeForm.start).toISOString(),
      end: new Date(activeForm.end).toISOString(),
      isRecurring: activeForm.isRecurring,
      weekday: activeForm.isRecurring ? Number(activeForm.weekday) : null,
    };

    if (canAssignPractitioner) {
      payload.practitionerId = activeForm.practitionerId;
    }

    if (activeForm.latitude) {
      payload.latitude = Number(activeForm.latitude);
    }
    if (activeForm.longitude) {
      payload.longitude = Number(activeForm.longitude);
    }

    try {
      if (editingSlot) {
        await updateMutation.mutateAsync({ id: editingSlot.id, payload });
        setMessage('Travel slot updated.');
      } else {
        await createMutation.mutateAsync(payload);
        setMessage('Travel slot created.');
      }
      resetDialog();
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to save travel slot');
    }
  }

  async function handleDelete(id: string) {
    setMessage(null);
    try {
      await deleteMutation.mutateAsync(id);
      setMessage('Travel slot deleted.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to delete travel slot');
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Upcoming travel</h2>
          <p className="text-sm text-muted-foreground">
            Share locations and times so clients can match appointments to your schedule.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(value) => (value ? openCreateDialog() : resetDialog())}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Add travel slot</Button>
          </DialogTrigger>
          {activeForm ? (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSlot ? 'Edit travel slot' : 'Create travel slot'}</DialogTitle>
                <DialogDescription>Let clients know where you&apos;ll be working.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {canAssignPractitioner ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Practitioner</label>
                    <Select
                      value={activeForm.practitionerId}
                      onValueChange={(value) => setActiveForm((prev) => prev && { ...prev, practitionerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {practitioners.map((practitioner) => (
                          <SelectItem key={practitioner.id} value={practitioner.id}>
                            {practitioner.name ?? practitioner.email ?? 'Team member'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <Input
                    value={activeForm.title}
                    onChange={(event) => setActiveForm((prev) => prev && { ...prev, title: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <Input
                    value={activeForm.locationName}
                    onChange={(event) => setActiveForm((prev) => prev && { ...prev, locationName: event.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
                  <Textarea
                    value={activeForm.description}
                    onChange={(event) => setActiveForm((prev) => prev && { ...prev, description: event.target.value })}
                    minRows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Start</label>
                    <Input
                      type="datetime-local"
                      value={activeForm.start}
                      onChange={(event) => setActiveForm((prev) => prev && { ...prev, start: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">End</label>
                    <Input
                      type="datetime-local"
                      value={activeForm.end}
                      onChange={(event) => setActiveForm((prev) => prev && { ...prev, end: event.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Latitude (optional)</label>
                    <Input
                      value={activeForm.latitude}
                      onChange={(event) => setActiveForm((prev) => prev && { ...prev, latitude: event.target.value })}
                      placeholder="-37.8136"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Longitude (optional)</label>
                    <Input
                      value={activeForm.longitude}
                      onChange={(event) => setActiveForm((prev) => prev && { ...prev, longitude: event.target.value })}
                      placeholder="144.9631"
                    />
                  </div>
                </div>
                <div className="space-y-3 rounded-md border bg-muted/30 px-4 py-3">
                  <label className="flex items-start gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={activeForm.isRecurring}
                      onChange={(event) =>
                        setActiveForm((prev) => prev && { ...prev, isRecurring: event.target.checked })
                      }
                    />
                    Repeat weekly on a specific day
                  </label>
                  {activeForm.isRecurring ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Weekday</label>
                      <Select
                        value={activeForm.weekday}
                        onValueChange={(value) => setActiveForm((prev) => prev && { ...prev, weekday: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select weekday" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDayOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
                {message ? <p className="text-sm text-destructive">{message}</p> : null}
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={resetDialog} disabled={isBusy}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isBusy}>
                    {editingSlot ? 'Save changes' : 'Create slot'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          ) : null}
        </Dialog>
      </div>

      <div className="space-y-4">
        {slotsQuery.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t published any travel plans yet.</p>
        ) : (
          slotsQuery.data.map((slot) => (
            <div key={slot.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">{slot.title}</p>
                  <p className="text-sm text-muted-foreground">{slot.locationName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(slot.start)} – {formatDateTime(slot.end)}
                  </p>
                  {slot.isRecurring ? (
                    <p className="text-xs text-muted-foreground">Repeats weekly on {weekdayLabel(slot.weekday)}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Practitioner: {slot.practitionerName}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(slot)} disabled={isBusy}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(slot.id)} disabled={isBusy}>
                    Delete
                  </Button>
                </div>
              </div>
              {slot.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{slot.description}</p>
              ) : null}
            </div>
          ))
        )}
        {message && slotsQuery.data.length > 0 ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
