'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PortalNavItem {
  href: string;
  label: string;
}

interface PortalNavProps {
  items: PortalNavItem[];
}

export function PortalNav({ items }: PortalNavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== '/portal' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
