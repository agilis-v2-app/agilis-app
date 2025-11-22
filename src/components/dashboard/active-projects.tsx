'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProjectCard, ProjectCardSkeleton } from './project-card';
import { getToken } from '@/lib/auth-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '../ui/button';
import { NewProjectDialog } from './project/new-project-dialog';
import { subDays, isAfter, parseISO } from 'date-fns';

type ApiProject = {
  _id: string;
  name: string;
  description: string;
  members: {
    user: {
      _id: string;
      email: string;
      username?: string;
    };
    role: string;
  }[];
  tasks: { status: 'todo' | 'pending' | 'done' }[];
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
  isOwner: boolean;
  tasks: {
    todo: number;
    pending: number;
    done: number;
  };
  users: {
    src: string;
    fallback: string;
  }[];
};

type User = {
  _id: string;
};

const MAX_PROJECTS_TO_SHOW = 3;

export function ActiveProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  async function fetchProjects(user: User | null) {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar projetos.');
      }

      const data = await response.json();
      setTotalProjects(data.totalProjects || data.projects.length);

      const oneWeekAgo = subDays(new Date(), 7);

      const recentProjects: ApiProject[] = data.projects.filter(
        (p: ApiProject) => isAfter(parseISO(p.createdAt), oneWeekAgo)
      );

      const formattedProjects = recentProjects.map((p: ApiProject) => {
        const tasksByStatus = p.tasks.reduce(
          (acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          },
          { todo: 0, pending: 0, done: 0 } as {
            [key in 'todo' | 'pending' | 'done']: number;
          }
        );

        const owner = p.members.find((m) => m.role === 'owner');
        const isOwner = user ? owner?.user._id === user._id : false;

        return {
          id: p._id,
          name: p.name,
          isOwner,
          tasks: {
            todo: tasksByStatus.todo,
            pending: tasksByStatus.pending,
            done: tasksByStatus.done,
          },
          users: p.members.map((member) => ({
            src: '',
            fallback: (
              member.user.username || member.user.email
            )[0].toUpperCase(),
          })),
        };
      });
      setProjects(formattedProjects);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function fetchUserAndProjects() {
      setIsLoading(true);
      let user: User | null = null;
      try {
        const token = await getToken();
        if (token) {
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (userResponse.ok) {
            user = await userResponse.json();
            setCurrentUser(user);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user', e);
      } finally {
        await fetchProjects(user);
      }
    }
    fetchUserAndProjects();
  }, []);

  const handleProjectCreated = () => {
    setIsNewProjectDialogOpen(false);
    fetchProjects(currentUser);
  };

  const projectsToShow = projects.slice(0, MAX_PROJECTS_TO_SHOW);
  const remainingProjectsCount = totalProjects - projectsToShow.length;

  return (
    <>
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold tracking-tight">
            Projetos Recentes
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))
            : null}

          {!isLoading && projects.length === 0 ? (
            <div className="col-span-full xl:col-span-4">
              <Card className="flex h-full min-h-[210px] flex-col items-center justify-center border-dashed bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <p className="mt-4 font-bold text-foreground">
                    Nenhum projeto recente
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crie um novo projeto para começar.
                  </p>
                  <Button
                    onClick={() => setIsNewProjectDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Novo Projeto
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {projectsToShow.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                >
                  <ProjectCard
                    name={project.name}
                    tasks={project.tasks}
                    users={project.users}
                    isOwner={project.isOwner}
                  />
                </Link>
              ))}
              {!isLoading && totalProjects > MAX_PROJECTS_TO_SHOW && (
                <Link href="/dashboard/projects">
                  <Card className="flex p-2 flex-col items-center justify-center border-dashed bg-muted/50 transition-colors hover:border-primary hover:bg-muted">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-primary text-primary">
                        <Plus className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-center font-bold text-foreground">
                        +{remainingProjectsCount} projetos
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ver todos
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
