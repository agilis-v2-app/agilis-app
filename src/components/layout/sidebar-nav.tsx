'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvitationStore } from '@/hooks/use-invitation-store';

const links = [
  {
    href: '/dashboard',
    label: 'Visão Geral',
    icon: <Home className="h-5 w-5" />,
    exact: true,
  },
  {
    href: '/dashboard/projects',
    label: 'Projetos',
    icon: <Package className="h-5 w-5" />,
    exact: false,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { count } = useInvitationStore();

  return (
    <nav className="flex h-full flex-col items-center gap-4 px-2 py-4 text-center">
      {links.map(({ href, label, icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname.startsWith(href) && href !== '/dashboard';

        return (
          <Link
            key={label}
            href={href}
            className={cn(
              'relative flex w-full flex-col items-center justify-center gap-1 rounded-lg p-2 text-center transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-accent-foreground'
            )}
          >
            {icon}
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
      <div className="mt-auto flex flex-col items-center gap-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1 rounded-lg p-2 text-center transition-colors',
            pathname === '/dashboard/settings'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs font-medium">Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}
