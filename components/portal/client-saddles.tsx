'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SaddleSummary {
  id: string;
  type: string;
  color?: string | null;
  brand?: string | null;
  seatSize?: string | null;
  gulletWidth?: string | null;
  notes?: string | null;
}

interface ClientSaddleManagerProps {
  initialSaddles: SaddleSummary[];
}

function createEmptyForm() {
  return {
    type: '',
    color: '',
    brand: '',
    seatSize: '',
    gulletWidth: '',
    notes: '',
  };
}

export function ClientSaddleManager({ initialSaddles }: ClientSaddleManagerProps) {
  const [saddles, setSaddles] = useState<SaddleSummary[]>(initialSaddles);
  const [form, setForm] = useState(createEmptyForm);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState(createEmptyForm);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch('/api/portal/saddles', { cache: 'no-store' });
    if (!res.ok) return;
    const payload = (await res.json()) as { items: SaddleSummary[] };
    setSaddles(payload.items);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const payload = {
        type: form.type,
        color: form.color || undefined,
        brand: form.brand || undefined,
        seatSize: form.seatSize || undefined,
        gulletWidth: form.gulletWidth || undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch('/api/portal/saddles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to add saddle');
      }
      setForm(createEmptyForm());
      await refresh();
      setMessage('Saddle added.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to add saddle');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        type: editingForm.type,
        color: editingForm.color || undefined,
        brand: editingForm.brand || undefined,
        seatSize: editingForm.seatSize || undefined,
        gulletWidth: editingForm.gulletWidth || undefined,
        notes: editingForm.notes || undefined,
      };
      const res = await fetch(`/api/portal/saddles/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to update saddle');
      }
      setEditingId(null);
      setEditingForm(createEmptyForm());
      await refresh();
      setMessage('Saddle updated.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to update saddle');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/portal/saddles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? 'Unable to delete saddle');
      }
      await refresh();
      setMessage('Saddle removed.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to delete saddle');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold text-foreground">Add a saddle</h2>
        <p className="text-sm text-muted-foreground">Keep track of the tack you prefer practitioners to use.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Type of saddle</label>
            <Input
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Colour</label>
            <Input value={form.color} onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Brand</label>
            <Input value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Seat size</label>
            <Input
              value={form.seatSize}
              placeholder={'e.g. 17"'}
              onChange={(event) => setForm((prev) => ({ ...prev, seatSize: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Gullet width</label>
            <Input
              value={form.gulletWidth}
              placeholder="e.g. MW"
              onChange={(event) => setForm((prev) => ({ ...prev, gulletWidth: event.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea
              minRows={2}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? 'Saving…' : 'Add saddle'}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">My tack room</h2>
        {saddles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saddles recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {saddles.map((saddle) => {
              const isEditing = editingId === saddle.id;
              return (
                <div key={saddle.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{saddle.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {saddle.brand ? `${saddle.brand} • ` : ''}
                        {saddle.seatSize ? `Seat ${saddle.seatSize}` : 'Seat size unknown'}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingId(saddle.id);
                          setEditingForm({
                            type: saddle.type,
                            color: saddle.color ?? '',
                            brand: saddle.brand ?? '',
                            seatSize: saddle.seatSize ?? '',
                            gulletWidth: saddle.gulletWidth ?? '',
                            notes: saddle.notes ?? '',
                          });
                        }}
                        disabled={busy}
                      >
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(saddle.id)} disabled={busy}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    {saddle.color ? <p>Colour: {saddle.color}</p> : null}
                    {saddle.gulletWidth ? <p>Gullet width: {saddle.gulletWidth}</p> : null}
                    {saddle.notes ? <p>{saddle.notes}</p> : null}
                  </div>
                  {isEditing ? (
                    <form className="mt-4 space-y-3 rounded-md border bg-background/50 p-4" onSubmit={handleEditSave}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Type</label>
                          <Input
                            value={editingForm.type}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, type: event.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Colour</label>
                          <Input
                            value={editingForm.color}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, color: event.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Brand</label>
                          <Input
                            value={editingForm.brand}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, brand: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Seat size</label>
                          <Input
                            value={editingForm.seatSize}
                            placeholder={'e.g. 17"'}
                            onChange={(event) => setEditingForm((prev) => ({ ...prev, seatSize: event.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Gullet width</label>
                        <Input
                          value={editingForm.gulletWidth}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, gulletWidth: event.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Notes</label>
                        <Textarea
                          minRows={2}
                          value={editingForm.notes}
                          onChange={(event) => setEditingForm((prev) => ({ ...prev, notes: event.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={busy}>
                          {busy ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingForm(createEmptyForm());
                          }}
                          disabled={busy}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </div>
  );
}
