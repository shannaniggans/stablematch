'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ClientRegisterFormProps {
  practiceId: string;
  practiceName: string;
}

export function ClientRegisterForm({ practiceId, practiceName }: ClientRegisterFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    notes: '',
    shareProfileWithPractitioners: true,
    shareHorsesWithPractitioners: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateForm<T extends keyof typeof form>(key: T, value: (typeof form)[T]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practiceId,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          address: form.address || undefined,
          notes: form.notes || undefined,
          shareProfileWithPractitioners: form.shareProfileWithPractitioners,
          shareHorsesWithPractitioners: form.shareHorsesWithPractitioners,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Unable to register');
      }
      const login = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (login?.error) {
        setMessage('Registered successfully. Please sign in with your credentials.');
        setSubmitting(false);
        return;
      }
      router.replace('/portal');
      router.refresh();
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to register');
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        You are creating a client account for <span className="font-medium text-foreground">{practiceName}</span>.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">First name</label>
          <Input
            value={form.firstName}
            onChange={(event) => updateForm('firstName', event.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Last name</label>
          <Input
            value={form.lastName}
            onChange={(event) => updateForm('lastName', event.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Email</label>
        <Input
          type="email"
          value={form.email}
          onChange={(event) => updateForm('email', event.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Password</label>
          <Input
            type="password"
            value={form.password}
            onChange={(event) => updateForm('password', event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Confirm password</label>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => updateForm('confirmPassword', event.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Phone (optional)</label>
          <Input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Address (optional)</label>
          <Input value={form.address} onChange={(event) => updateForm('address', event.target.value)} autoComplete="street-address" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Notes for practitioners (optional)</label>
        <Textarea
          minRows={3}
          value={form.notes}
          onChange={(event) => updateForm('notes', event.target.value)}
        />
      </div>
      <div className="space-y-3 rounded-lg border bg-card px-4 py-3">
        <p className="text-sm font-medium text-foreground">Default sharing</p>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={form.shareProfileWithPractitioners}
            onChange={(event) => updateForm('shareProfileWithPractitioners', event.target.checked)}
          />
          <span>Share my profile with practitioners for future bookings.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={form.shareHorsesWithPractitioners}
            onChange={(event) => updateForm('shareHorsesWithPractitioners', event.target.checked)}
          />
          <span>Share horse information with practitioners for upcoming appointments.</span>
        </label>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
