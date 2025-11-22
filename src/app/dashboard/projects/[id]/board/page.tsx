
'use client';

import { useParams } from 'next/navigation';
import { TaskKanbanBoard } from '@/components/dashboard/project/task-kanban-board';
import { Skeleton } from '@/components/ui/skeleton';
import useProjectStore from '@/hooks/use-project-store';

export default function ProjectBoardPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    project,
    currentUser,
    isLoading,
    fetchProjectById,
  } = useProjectStore();

  const handleTasksUpdate = () => {
    fetchProjectById(id);
  };

  const activeTasks =
    project?.tasks.filter(
      (task) =>
        task.status === 'todo' ||
        task.status === 'pending' ||
        task.status === 'done'
    ) || [];

  const currentUserRole =
    project?.members.find((m) => m.user._id === currentUser?._id)?.role ||
    'member';

  if (isLoading && !project) {
    return (
      <div>
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          O projeto que você está procurando não existe ou foi movido.
        </p>
      </div>
    );
  }

  return (
    <>
      <TaskKanbanBoard
        tasks={activeTasks}
        projectId={id}
        currentUser={{ id: currentUser?._id ?? '', role: currentUserRole }}
        members={project.members}
        onTaskUpdated={handleTasksUpdate}
      />
    </>
  );
}
