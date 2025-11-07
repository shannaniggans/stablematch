import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireClient } from '@/lib/auth/utils';
import { PortalNav } from '@/components/portal/portal-nav';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/portal', label: 'Overview' },
  { href: '/portal/profile', label: 'Profile' },
  { href: '/portal/horses', label: 'Horses' },
  { href: '/portal/sharing', label: 'Sharing' },
  { href: '/portal/travel', label: 'Travel' },
  { href: '/portal/tack', label: 'My Tack Room' },
];

export default async function PortalAuthenticatedLayout({ children }: { children: ReactNode }) {
  const { client } = await requireClient();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">FullStride Client Portal</p>
              <h1 className="text-2xl font-semibold text-foreground">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {client.practice.name} • {client.practice.timezone}
              </p>
            </div>
            <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}>
              Return to practice site
            </Link>
          </div>
          <PortalNav items={NAV_ITEMS} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
