'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? 'demo@fullstride.local';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? 'demo-login';

export function SignInCard() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signIn('email', {
        email,
        redirect: false,
      });
      if (result?.ok) {
        setMessage('Check your email for a magic link to sign in.');
      } else if (result?.error) {
        setMessage(result.error);
      }
    } catch (error: any) {
      setMessage(error.message ?? 'Failed to send sign-in link');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setSubmitting(true);
    await signIn('google');
  }

  async function handleDemo() {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signIn('credentials', {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        callbackUrl: '/dashboard',
        redirect: false,
      });
      if (result?.error) {
        setMessage(result.error);
        setSubmitting(false);
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (error: any) {
      setMessage(error.message ?? 'Unable to sign in locally');
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-muted bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to manage your FullStride practice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="email">
              Work email
            </label>
            <Input
              id="email"
              type="email"
              required
              placeholder="alex@fullstride.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            Email me a link
          </Button>
        </form>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <Separator className="flex-1" />
            <span>or</span>
            <Separator className="flex-1" />
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={handleGoogle} disabled={submitting}>
            Continue with Google
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={handleDemo} disabled={submitting}>
            Continue with local demo
          </Button>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
