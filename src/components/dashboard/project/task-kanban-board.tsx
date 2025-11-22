
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import type { Member } from '@/app/dashboard/projects/[id]/board/page';
import { CheckCircle2, CircleHelp, Loader, Loader2 } from 'lucide-react';

import type { Task } from './task-card';
import { TaskCard } from './task-card';
import { SortableTaskCard } from './sortable-task-card';
import { useToast } from '@/hooks/use-toast';
import { getToken } from '@/lib/auth-actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskStatus = 'todo' | 'pending' | 'done';

type CurrentUser = {
  id: string;
  role: 'owner' | 'member';
};

type TaskKanbanBoardProps = {
  tasks: Task[];
  projectId: string;
  currentUser: CurrentUser;
  members: Member[];
  onTaskUpdated: () => void;
};

type Column = {
  id: TaskStatus;
  title: string;
  icon: JSX.Element;
};

const columns: Column[] = [
  { id: 'todo', title: 'A Fazer', icon: <CircleHelp className="h-4 w-4" /> },
  {
    id: 'pending',
    title: 'Em Andamento',
    icon: <Loader className="h-4 w-4" />,
  },
  {
    id: 'done',
    title: 'Concluído',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

function KanbanColumn({
  column,
  tasks,
  className,
  currentUserRole,
  members,
  projectId,
  onTaskUpdated,
}: {
  column: Column;
  tasks: Task[];
  className?: string;
  currentUserRole: 'owner' | 'member';
  members: Member[];
  projectId: string;
  onTaskUpdated: () => void;
}) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      key={column.id}
      className={cn('flex flex-col gap-4', className)}
    >
      <div className="flex items-center justify-between p-2 rounded-lg bg-background">
        <div className="flex items-center gap-2">
          {column.icon}
          <h2 className="font-semibold text-base">{column.title}</h2>
          <span className="text-xs font-semibold text-muted-foreground bg-muted h-6 w-6 flex items-center justify-center rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      <ScrollArea className="h-[65vh]">
        <div className="flex flex-col gap-4 h-full min-h-24 pr-4">
          <SortableContext items={tasksIds}>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                currentUserRole={currentUserRole}
                members={members}
                projectId={projectId}
                onTaskUpdated={onTaskUpdated}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center p-4 h-full border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm">
                Arraste tarefas aqui.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TaskKanbanBoard({
  tasks: initialTasks,
  projectId,
  currentUser,
  members,
  onTaskUpdated,
}: TaskKanbanBoardProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.id] = tasks.filter((task) => task.status === col.id);
        return acc;
      },
      {} as Record<TaskStatus, Task[]>
    );
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    setIsUpdating(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao atualizar o status da tarefa.');
      }
      toast({
        title: 'Status atualizado!',
        description: 'O status da tarefa foi alterado com sucesso.',
      });
      // A UI já foi atualizada otimisticamente.
      // A prop onTaskUpdated() aqui causaria uma nova busca, resultando em um "flicker".
      // A consistência dos dados será garantida na próxima atualização do store/navegação.
      onTaskUpdated();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao mover tarefa',
        description: error.message,
      });
      // Reverte para o estado original do servidor em caso de falha.
      setTasks(initialTasks);
    } finally {
      setIsUpdating(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
      const task = event.active.data.current.task as Task;

      if (
        currentUser.role === 'member' &&
        task.assigneeId !== currentUser.id
      ) {
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Você só pode mover tarefas que são suas.',
        });
        setActiveTask(null); // Prevent drag
        return;
      }
      setActiveTask(task);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;
    if (!activeTask) return;

    const activeId = active.id;
    const overId = over.id;

    // Not dropping on a valid target
    if (activeId === overId) return;

    const activeTaskOriginalStatus = activeTask.status;

    // Find the target column status
    const overIsColumn = over.data.current?.type === 'Column';
    const overIsTask = over.data.current?.type === 'Task';
    let targetStatus: TaskStatus;

    if (overIsColumn) {
      targetStatus = over.id as TaskStatus;
    } else if (overIsTask) {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
    } else {
      return;
    }

    // Update UI optimistically
    setTasks((currentTasks) => {
      const activeIndex = currentTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return currentTasks;

      let overIndex;
      // Se estiver soltando numa coluna vazia, o overIsTask será falso.
      // Precisamos encontrar onde inserir a tarefa.
      if (overIsTask) {
        overIndex = currentTasks.findIndex((t) => t.id === overId);
      } else {
        // Find the index of the first task in the target column
        const firstTaskInTargetColumn = currentTasks.find(t => t.status === targetStatus);
        overIndex = firstTaskInTargetColumn
          ? currentTasks.findIndex(t => t.id === firstTaskInTargetColumn.id)
          : currentTasks.length;
      }

      // Update status on the task object
      const updatedTasks = [...currentTasks];
      updatedTasks[activeIndex] = {
        ...updatedTasks[activeIndex],
        status: targetStatus,
      };

      // Move the task in the array
      return arrayMove(updatedTasks, activeIndex, overIndex);
    });

    // Call API if status changed
    if (targetStatus !== activeTaskOriginalStatus) {
      updateTaskStatus(activeId as string, targetStatus);
    }
  }

  return (
    <div className="relative bg-card border rounded-lg p-4">
      {isUpdating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((col, index) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByStatus[col.id]}
              currentUserRole={currentUser.role}
              members={members}
              projectId={projectId}
              onTaskUpdated={onTaskUpdated}
              className={cn(
                'p-4',
                index > 0 && 'md:border-l',
                index > 0 && index < columns.length && 'border-border'
              )}
            />
          ))}
        </div>

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  isOverlay
                  currentUserRole={currentUser.role}
                />
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
}
