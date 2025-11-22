"use client";
import {
  Folder,
  Search,
  FileText,
  ChevronRight,
  Mail,
  Check,
  X,
  Inbox,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { Input } from "@/components/ui/input";
import { Logo } from "../logo";
import { Kbd } from "../ui/kbd";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getToken } from "@/lib/auth-actions";
import Fuse from "fuse.js";
import { useInvitationStore } from "@/hooks/use-invitation-store";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Project = { _id: string; name: string };
type Task = { _id: string; name: string, projectId: string };

type SearchResult = {
  projects: Project[];
  tasks: Task[];
};

function InvitationPopoverContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { invitations, isLoading, count, fetchCount, removeInvitation } =
    useInvitationStore();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const handleAction = async (
    invitationId: string,
    action: "accept" | "reject"
  ) => {
    setIsProcessing(invitationId);
    try {
      const token = await getToken();
      if (!token) throw new Error("Token não encontrado.");

      const url = `${window.__ENV.NEXT_PUBLIC_API_URL}/invitations/${invitationId}/${action}`;
      const method = action === "accept" ? "POST" : "DELETE";

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao processar o convite.");
      }

      toast({
        title: "Sucesso!",
        description: `Convite ${action === "accept" ? "aceito" : "rejeitado"}.`,
      });

      if (action === "accept") {
        router.push("/dashboard/projects");
      } else {
        removeInvitation(invitationId);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const recentInvitations = invitations.slice(0, 3);

  return (
    <PopoverContent className="w-96 p-0" align="end">
      <div className="p-4">
        <h4 className="font-medium text-foreground">Convites Pendentes</h4>
      </div>
      <Separator />
      <div className="max-h-96 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-4 p-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8 mb-2" />
            <p>Nenhum convite novo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentInvitations.map((inv) => {
              const isThisOneProcessing = isProcessing === inv._id;

              return (
                <Card key={inv._id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-semibold text-foreground truncate">
                              {inv.project.name}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{inv.project.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground truncate">
                              <span className="font-semibold text-foreground">
                                {inv.inviter.username}
                              </span>{" "}
                              te convidou para o projeto.
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {inv.inviter.username} te convidou para o projeto.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <p className="text-xs text-muted-foreground pt-1">
                        {formatDistanceToNow(parseISO(inv.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(inv._id, "accept")}
                        disabled={isThisOneProcessing}
                        className="flex-1 text-green-500 bg-green-500/10 hover:bg-green-500/20"
                      >
                        <Check className="h-4 w-4" />
                        <span>Aceitar</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(inv._id, "reject")}
                        disabled={isThisOneProcessing}
                        className="flex-1 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                      >
                        <X className="h-4 w-4" />
                        <span>Recusar</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Separator />
      <div className="p-2">
        <Button variant="ghost" className="w-full justify-center" asChild>
          <Link href="/dashboard/invitations">Ver todos os convites</Link>
        </Button>
      </div>
    </PopoverContent>
  );
}

export function DashboardHeader() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    projects: [],
    tasks: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { count: invitationCount } = useInvitationStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults({ projects: [], tasks: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Token não encontrado.");
      const headers = { Authorization: `Bearer ${token}` };

      const [projectsRes, tasksRes] = await Promise.all([
        fetch(`${window.__ENV.NEXT_PUBLIC_API_URL}/projects?limit=100`, {
          headers,
        }),
        fetch(`${window.__ENV.NEXT_PUBLIC_API_URL}/users/me/tasks?limit=100`, {
          headers,
        }),
      ]);

      if (!projectsRes.ok || !tasksRes.ok) {
        throw new Error("Falha ao buscar resultados.");
      }

      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();

      const allProjects: Project[] = projectsData.projects || [];
      const allApiTasks: any[] = tasksData.tasks || [];

      const allTasks: Task[] = allApiTasks.map((task) => {
        return {
          projectId: task.projectId,
          _id: task.taskId,
          name: task.name,
        };
      });

      const projectFuse = new Fuse(allProjects, {
        keys: ["name"],
        threshold: 0.4,
      });

      const taskFuse = new Fuse(allTasks, {
        keys: ["name"],
        threshold: 0.4,
      });

      const projectResults = projectFuse
        .search(searchQuery)
        .map((res) => res.item);
      const taskResults = taskFuse.search(searchQuery).map((res) => res.item);

      setResults({
        projects: projectResults.slice(0, 5),
        tasks: taskResults.slice(0, 5),
      });
    } catch (error) {
      console.error(error);
      setResults({ projects: [], tasks: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    performSearch(newQuery);
  };

  const handleFocus = () => {
    if (query.length > 0) {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (query.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [query]);

  const showPopover = open && query.length > 0;
  const noProjectsFound =
    query.length > 0 && !isLoading && results.projects.length === 0;
  const noTasksFound =
    query.length > 0 && !isLoading && results.tasks.length === 0;
  const noResults = noProjectsFound && noTasksFound;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Logo />
      </div>

      <div className="flex flex-1 justify-center">
        <Popover open={showPopover} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <form
              className="relative w-full max-w-md"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Pesquisar projetos e minhas tarefas..."
                className="pl-8"
                value={query}
                onChange={handleQueryChange}
                onFocus={handleFocus}
              />
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden items-center gap-1 sm:flex">
                <Kbd>Ctrl</Kbd>
                <Kbd>K</Kbd>
              </div>
            </form>
          </PopoverTrigger>
          <PopoverContent
            className="p-2 w-full max-w-md"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </div>
            )}
            {!isLoading && noResults && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado.
              </div>
            )}
            {!isLoading && !noResults && (
              <div className="space-y-2">
                {results.projects.length > 0 && (
                  <div>
                    <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Projetos
                    </h4>
                    <div className="space-y-1">
                      {results.projects.map((project) => (
                        <Link
                          key={project._id}
                          href={`/dashboard/projects/${project._id}`}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => setOpen(false)}
                        >
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">
                            {project.name}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {results.tasks.length > 0 && (
                  <div>
                    <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Minhas Tarefas
                    </h4>
                    <div className="space-y-1">
                      {results.tasks.map((task) => {
                        return (
                          <Link
                            key={task._id}
                            href={`/dashboard/projects/${task.projectId}/board#${task._id}`}
                            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                            onClick={() => setOpen(false)}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{task.name}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Mail className="h-5 w-5" />
              {invitationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
              <span className="sr-only">Ver convites</span>
            </Button>
          </PopoverTrigger>
          <InvitationPopoverContent />
        </Popover>
        <UserNav />
      </div>
    </header>
  );
}
