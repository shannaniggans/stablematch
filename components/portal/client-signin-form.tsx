'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DEMO_CLIENT_EMAIL = process.env.NEXT_PUBLIC_DEMO_CLIENT_EMAIL ?? 'client@fullstride.local';
const DEMO_CLIENT_PASSWORD = process.env.NEXT_PUBLIC_DEMO_CLIENT_PASSWORD ?? 'client-login';

export function ClientSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackParam = searchParams?.get('callbackUrl') ?? null;
  const callbackUrl = useMemo(() => {
    if (!callbackParam) return '/portal';
    let value = callbackParam;
    try {
      if (value.startsWith('http')) {
        const parsed = new URL(value);
        value = parsed.pathname + parsed.search;
      }
    } catch {
      value = callbackParam;
    }
    if (!value.startsWith('/')) return '/portal';
    if (value.startsWith('/portal/signin')) return '/portal';
    return value || '/portal';
  }, [callbackParam]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (!result || result.error) {
        setMessage(result?.error ?? 'Unable to sign in. Check your details and try again.');
        setSubmitting(false);
        return;
      }
      const target = result.url ?? callbackUrl;
      window.location.replace(target);
    } catch (error: any) {
      setMessage(error.message ?? 'Unexpected error while signing in.');
      setSubmitting(false);
    }
  }

  async function handleDemo() {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signIn('credentials', {
        email: DEMO_CLIENT_EMAIL,
        password: DEMO_CLIENT_PASSWORD,
        callbackUrl: '/portal',
        redirect: false,
      });
      if (!result || result.error) {
        setMessage(result?.error ?? 'Demo login unavailable right now.');
        setSubmitting(false);
        return;
      }
      window.location.replace(result.url ?? '/portal');
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to start demo session.');
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button type="button" variant="ghost" className="w-full text-sm" onClick={handleDemo} disabled={submitting}>
          Use demo client
        </Button>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
