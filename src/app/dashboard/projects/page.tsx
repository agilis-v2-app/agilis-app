'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ProjectCard,
  ProjectCardSkeleton,
} from '@/components/dashboard/project-card';
import { getToken } from '@/lib/auth-actions';
import { Plus, FolderKanban } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { NewProjectDialog } from '@/components/dashboard/project/new-project-dialog';

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

const ITEMS_PER_PAGE = 8;

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);

  const fetchProjects = async (page: number, user: User | null) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects?page=${page}&limit=${ITEMS_PER_PAGE}`,
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

      const formattedProjects = data.projects.map((p: ApiProject) => {
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
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
        await fetchProjects(currentPage, user);
      }
    }
    fetchUserAndProjects();
  }, [currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleProjectCreated = () => {
    setIsNewProjectDialogOpen(false);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      // Re-fetch with current user data
      fetchProjects(1, currentUser);
    }
  };

  return (
    <>
      <NewProjectDialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
      <div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-headline text-2xl font-bold tracking-tight">
              Projetos
            </h1>
            <p className="text-sm text-muted-foreground">
              Todos os seus projetos em um só lugar.
            </p>
          </div>
          <Button onClick={() => setIsNewProjectDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))
          ) : projects.length === 0 ? (
            <div className="col-span-full">
              <Card className="flex h-full min-h-[190px] flex-col items-center justify-center border-dashed bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FolderKanban className="h-6 w-6" />
                  </div>
                  <p className="mt-4 font-bold text-foreground">
                    Nenhum projeto encontrado
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Comece criando seu primeiro projeto.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            projects.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <ProjectCard
                  name={project.name}
                  tasks={project.tasks}
                  users={project.users}
                  isOwner={project.isOwner}
                />
              </Link>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePreviousPage();
                    }}
                    className={
                      currentPage === 1 || isLoading
                        ? 'pointer-events-none text-muted-foreground'
                        : undefined
                    }
                  />
                </PaginationItem>
                <PaginationItem className="font-medium text-foreground">
                  Página {currentPage} de {totalPages}
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNextPage();
                    }}
                    className={
                      currentPage === totalPages || isLoading
                        ? 'pointer-events-none text-muted-foreground'
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
}
