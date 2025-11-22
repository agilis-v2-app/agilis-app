import { SidebarNav } from './sidebar-nav';

export function Sidebar() {
  return (
    <aside className="sticky top-16 h-[calc(100dvh-4rem)] w-20 flex-col border-r bg-background">
      <SidebarNav />
    </aside>
  );
}
