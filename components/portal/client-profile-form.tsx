'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ClientProfileFormProps {
  initial: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    shareProfileWithPractitioners: boolean;
    shareHorsesWithPractitioners: boolean;
  };
}

export function ClientProfileForm({ initial }: ClientProfileFormProps) {
  const [form, setForm] = useState({
    firstName: initial.firstName,
    lastName: initial.lastName,
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    address: initial.address ?? '',
    notes: initial.notes ?? '',
    shareProfileWithPractitioners: initial.shareProfileWithPractitioners,
    shareHorsesWithPractitioners: initial.shareHorsesWithPractitioners,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          address: form.address || null,
          notes: form.notes || null,
          shareProfileWithPractitioners: form.shareProfileWithPractitioners,
          shareHorsesWithPractitioners: form.shareHorsesWithPractitioners,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Unable to save profile');
      }
      setMessage('Profile updated.');
    } catch (error: any) {
      setMessage(error.message ?? 'Unexpected error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">First name</label>
          <Input
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Last name</label>
          <Input
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Email</label>
        <Input
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Phone</label>
          <Input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Address</label>
          <Input
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Notes for practitioners</label>
        <Textarea
          minRows={3}
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
        />
      </div>
      <div className="space-y-3 rounded-lg border bg-card px-4 py-3">
        <p className="text-sm font-medium text-foreground">Sharing defaults</p>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={form.shareProfileWithPractitioners}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, shareProfileWithPractitioners: event.target.checked }))
            }
          />
          <span>Share my profile with practitioners automatically.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={form.shareHorsesWithPractitioners}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, shareHorsesWithPractitioners: event.target.checked }))
            }
          />
          <span>Share my horse information with practitioners automatically.</span>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
