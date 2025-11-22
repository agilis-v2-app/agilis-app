'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from './task-card';
import { TaskCard } from './task-card';
import type { Member } from '@/app/dashboard/projects/[id]/board/page';

type SortableTaskCardProps = {
  task: Task;
  currentUserRole: 'owner' | 'member';
  members: Member[];
  projectId: string;
  onTaskUpdated: () => void;
};

export function SortableTaskCard({
  task,
  currentUserRole,
  members,
  projectId,
  onTaskUpdated,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        currentUserRole={currentUserRole}
        members={members}
        projectId={projectId}
        onTaskUpdated={onTaskUpdated}
      />
    </div>
  );
}
