'use client';

import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Sidebar } from '@/components/layout/sidebar';
import { useInvitationStore } from '@/hooks/use-invitation-store';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchCount } = useInvitationStore();

  useEffect(() => {
    // Fetch on initial mount
    fetchCount();

    // Optional: set up an interval to periodically check for new invitations
    const interval = setInterval(fetchCount, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, [fetchCount]);

  return (
    <div className="min-h-dvh flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
