import { ActiveProjects } from '@/components/dashboard/active-projects';
import { DashboardOverviewHeader } from '@/components/dashboard/dashboard-overview-header';
import { MyTasks } from '@/components/dashboard/my-tasks';

export default function DashboardPage() {
  return (
    <>
      <DashboardOverviewHeader />
      <div className="mt-8">
        <ActiveProjects />
      </div>
      <div className="mt-8">
        <MyTasks />
      </div>
    </>
  );
}
