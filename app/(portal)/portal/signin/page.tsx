import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientSignInForm } from '@/components/portal/client-signin-form';

export default function ClientPortalSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-12">
      <Card className="w-full max-w-md border-muted bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Client sign in</CardTitle>
          <CardDescription>Access your FullStride portal to manage profile and horses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSignInForm />
          <p className="text-center text-xs text-muted-foreground">
            Need an account?{' '}
            <Link href="/portal/register" className="font-medium text-primary hover:underline">
              Create one here
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
