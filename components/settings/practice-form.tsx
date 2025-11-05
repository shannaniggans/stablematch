'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PracticeFormProps {
  name: string;
  timezone: string;
}

export function PracticeForm({ name, timezone }: PracticeFormProps) {
  const [formState, setFormState] = useState({ name, timezone });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/practice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!res.ok) {
        throw new Error('Failed to update practice');
      }
      toast.success('Practice details updated');
    } catch (error: any) {
      toast.error(error.message ?? 'Unable to save changes');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="practice-name">
          Practice name
        </label>
        <Input
          id="practice-name"
          value={formState.name}
          onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          required
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground" htmlFor="practice-timezone">
          Default timezone
        </label>
        <Input
          id="practice-timezone"
          value={formState.timezone}
          onChange={(event) => setFormState((prev) => ({ ...prev, timezone: event.target.value }))}
          required
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">Use an IANA timezone identifier (e.g. Australia/Sydney).</p>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
