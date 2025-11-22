'use client';
import {
  MoreHorizontal,
  CheckCircle2,
  CircleHelp,
  CheckCheck,
} from 'lucide-react';
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  formatDistanceToNow,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getToken } from '@/lib/auth-actions';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Task as DetailedTask } from './project/task-card';

type TaskStatus = 'Concluída' | 'Pendente' | 'Em andamento';
type ApiStatus = 'todo' | 'pending' | 'done';

type Task = DetailedTask & {
  project: string;
  projectId: string;
};

const statusApiToUiMap: Record<ApiStatus, TaskStatus> = {
  todo: 'Pendente',
  pending: 'Em andamento',
  done: 'Concluída',
};

type ApiTask = {
  projectId: string;
  projectName: string;
  taskId: string;
  name: string;
  description: string;
  status: ApiStatus;
  dueDate: string;
  assignee: {
    id: string;
    username: string;
  };
  assigneeId?: string;
};

const statusConfig: Record<
  TaskStatus,
  { icon: JSX.Element; variant: 'default' | 'secondary' | 'destructive' }
> = {
  Concluída: {
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    variant: 'default',
  },
  Pendente: {
    icon: <CircleHelp className="h-5 w-5 text-yellow-500" />,
    variant: 'secondary',
  },
  'Em andamento': {
    icon: <CircleHelp className="h-5 w-5 text-blue-500" />,
    variant: 'secondary',
  },
};

const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  const isDateInPast = isPast(date) && !isToday(date);

  let formattedDate: string;

  if (isToday(date)) {
    formattedDate = 'Hoje';
  } else if (isTomorrow(date)) {
    formattedDate = 'Amanhã';
  } else if (isDateInPast) {
    formattedDate = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } else {
    formattedDate = format(date, "d 'de' MMM.", { locale: ptBR });
  }

  return {
    formattedDate,
    isPast: isDateInPast,
  };
};

export function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  async function fetchTasks() {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      const response = await fetch(
        `${window.__ENV.NEXT_PUBLIC_API_URL}/users/me/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar tarefas.');
      }

      const data: { tasks: ApiTask[] } = await response.json();

      const formattedTasks: Task[] = data.tasks.map((task) => ({
        id: task.taskId,
        name: task.name,
        description: task.description,
        status: task.status,
        project: task.projectName,
        projectId: task.projectId,
        dueDate: task.dueDate,
        assignee: task.assignee,
        assigneeId: task.assigneeId,
      }));
      setTasks(formattedTasks);
    } catch (error) {
      console.error(error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleMarkAsDone = async (e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const token = await getToken();
      if (!token) throw new Error('Token não encontrado.');

      const response = await fetch(
        `${window.__ENV.NEXT_PUBLIC_API_URL}/projects/${task.projectId}/tasks/${task.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'done' }),
        }
      );

      if (!response.ok) throw new Error('Falha ao atualizar a tarefa.');

      toast({
        title: 'Sucesso!',
        description: 'Tarefa marcada como concluída.',
      });
      // Optimistic update: remove the task from the list
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== task.id));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    }
  };

  const upcomingTasks = tasks
    .filter((task) => task.status !== 'done')
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  return (
    <section>
      <div>
        <h2 className="font-headline text-xl font-bold tracking-tight">
          Minhas Tarefas em Aberto
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Uma visão geral de suas tarefas atribuídas que não foram concluídas.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="hidden h-6 w-24 md:block" />
                  <Skeleton className="hidden h-5 w-32 lg:block" />
                  <Skeleton className="hidden h-5 w-20 sm:block" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </Card>
            ))
          : null}
        {!isLoading && upcomingTasks.length === 0 ? (
          <Card className="flex h-full min-h-[140px] flex-col items-center justify-center border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <CheckCheck className="h-6 w-6" />
              </div>
              <p className="mt-4 font-bold text-foreground">
                Tudo em ordem por aqui!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você não tem nenhuma tarefa em aberto.
              </p>
            </CardContent>
          </Card>
        ) : (
          upcomingTasks.map((task) => {
            const { formattedDate, isPast } = formatDate(task.dueDate);
            const isOverdue = isPast && task.status !== 'done';
            const statusLabel = statusApiToUiMap[task.status] || 'Pendente';
            const statusInfo = statusConfig[statusLabel];

            return (
              <Link
                key={task.id}
                href={`/dashboard/projects/${task.projectId}/board`}
              >
                <Card
                  className={cn(
                    'p-4 transition-all hover:bg-muted/50',
                    isOverdue && 'border-destructive/50'
                  )}
                >
                  <div className="grid grid-cols-[auto,1fr,auto,auto,auto,auto] items-center gap-4">
                    <div>{statusInfo.icon}</div>
                    <div
                      className={cn(
                        'truncate font-medium',
                        isOverdue && 'text-destructive'
                      )}
                      title={task.name}
                    >
                      {task.name}
                    </div>
                    <div className="hidden md:block">
                      <Badge
                        variant={isOverdue ? 'destructive' : statusInfo.variant}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'hidden lg:block text-sm',
                        isOverdue
                          ? 'text-destructive/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {task.project}
                    </div>
                    <div
                      className={cn(
                        'hidden sm:block text-sm',
                        isOverdue
                          ? 'text-destructive font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {formattedDate}
                    </div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Alternar menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={(e) => handleMarkAsDone(e, task)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marcar como concluída
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
