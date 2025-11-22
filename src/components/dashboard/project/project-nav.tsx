'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, KanbanSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProjectNavProps = {
  projectId: string;
  userRole: 'owner' | 'member';
};

export function ProjectNav({ projectId, userRole }: ProjectNavProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: `/dashboard/projects/${projectId}`,
      label: 'Visão Geral',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
      visible: true,
    },
    {
      href: `/dashboard/projects/${projectId}/board`,
      label: 'Quadro Kanban',
      icon: <KanbanSquare className="h-4 w-4" />,
      exact: false,
      visible: true,
    },
    {
      href: `/dashboard/projects/${projectId}/settings`,
      label: 'Gerenciar',
      icon: <Settings className="h-4 w-4" />,
      exact: true,
      visible: userRole === 'owner',
    },
  ];

  return (
    <nav className="mt-4 border-b">
      <div className="flex items-center gap-4 -mb-px">
        {navLinks
          .filter((link) => link.visible)
          .map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
