'use client';

import { Badge } from '@/components/ui/badge';
import { ClipboardList, FolderKanban } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getToken } from '@/lib/auth-actions';
import { Skeleton } from '../ui/skeleton';

type UserData = {
  username: string;
};

type ApiTask = {
  status: 'todo' | 'pending' | 'done' | 'canceled';
};

export function DashboardOverviewHeader() {
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }

    const formattedDate = format(now, "EEEE, d 'de' MMMM", {
      locale: ptBR,
    });
    setCurrentDate(
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
    );

    async function fetchData() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Token não encontrado.');
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [userResponse, tasksResponse, projectsResponse] =
          await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/tasks`, {
              headers,
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, { headers }),
          ]);

        if (!userResponse.ok)
          throw new Error('Falha ao buscar dados do usuário.');
        if (!tasksResponse.ok) throw new Error('Falha ao buscar tarefas.');
        if (!projectsResponse.ok) throw new Error('Falha ao buscar projetos.');

        const userData = await userResponse.json();
        const tasksData: { tasks: ApiTask[] } = await tasksResponse.json();
        const projectsData = await projectsResponse.json();

        setUser(userData);
        setPendingTasksCount(
          tasksData.tasks.filter(
            (t) => t.status !== 'done' && t.status !== 'canceled'
          ).length
        );
        setProjectCount(projectsData.totalProjects || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const getProjectLabel = () => {
    if (projectCount === 0) return 'Nenhum projeto';
    if (projectCount === 1) return 'Projeto';
    return 'Projetos';
  };

  const getTaskText = () => {
    if (pendingTasksCount === 0) {
      return 'Nenhuma tarefa sua em aberto';
    }
    return (
      <>
        Você tem{' '}
        <span className="font-semibold">{pendingTasksCount}</span>{' '}
        tarefa
        {pendingTasksCount > 1 ? 's' : ''} em aberto
      </>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex-1 space-y-1">
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <p className="text-sm text-muted-foreground">{currentDate}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>
              {greeting}, {user?.username}!
            </>
          )}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </>
        ) : (
          <>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="font-normal text-secondary-foreground">
                {getTaskText()}
              </span>
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="font-semibold">{projectCount}</span>
              <span className="font-normal text-secondary-foreground">
                {getProjectLabel()}
              </span>
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
