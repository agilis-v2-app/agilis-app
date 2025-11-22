
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { ProjectHeader } from '@/components/dashboard/project/project-header';
import { ProjectNav } from '@/components/dashboard/project/project-nav';
import useProjectStore from '@/hooks/use-project-store';

type ProjectLayoutProps = {
  children: React.ReactNode;
};

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const projectId = params.id as string;
  const {
    project,
    fetchProjectById,
    currentUser,
  } = useProjectStore();

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
    }
  }, [projectId, fetchProjectById]);

  const handleTaskChange = () => {
    if (projectId) {
      fetchProjectById(projectId);
    }
  };

  const userRole =
    project?.members.find((m) => m.user._id === currentUser?._id)?.role ||
    'member';

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Projetos', href: '/dashboard/projects' },
          { label: project?.name || 'Carregando...' },
        ]}
      />
      <div className="mt-4">
        <ProjectHeader
          projectId={projectId}
          name={project?.name || ''}
          description={project?.description || ''}
          members={project?.members || []}
          currentUserRole={userRole as 'owner' | 'member'}
          onTaskCreated={handleTaskChange}
        />
        <ProjectNav
          projectId={projectId}
          userRole={userRole as 'owner' | 'member'}
        />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
