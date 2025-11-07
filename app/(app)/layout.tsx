import Link from 'next/link';
import { ReactNode } from 'react';
import { LayoutDashboard, CalendarDays, Users, NotebookPen, FileSpreadsheet, Settings, MapPin } from 'lucide-react';
import { SideNav } from '@/components/layout/side-nav';
import { UserNav } from '@/components/layout/user-nav';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { requireUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/calendar', label: 'Calendar', icon: <CalendarDays className="h-4 w-4" /> },
  { href: '/clients', label: 'Clients', icon: <Users className="h-4 w-4" /> },
  { href: '/appointments', label: 'Appointments', icon: <NotebookPen className="h-4 w-4" /> },
  { href: '/travel', label: 'Travel', icon: <MapPin className="h-4 w-4" /> },
  { href: '/invoices', label: 'Invoices', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const practice = await prisma.practice.findUnique({ where: { id: user.practiceId } });

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 flex-col justify-between border-r bg-card/80 px-6 py-6 backdrop-blur lg:flex">
        <div className="space-y-8">
          <Link href="/dashboard" className="block text-lg font-semibold">
            <span className="text-primary">Full</span>Stride
          </Link>
          <SideNav items={NAV_ITEMS} />
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{practice?.name ?? 'Practice'}</p>
          <p>{practice?.timezone ?? 'Australia/Sydney'}</p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/dashboard" className="text-base font-semibold">
              {practice?.name ?? 'FullStride'}
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserNav name={user.name} email={user.email} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
