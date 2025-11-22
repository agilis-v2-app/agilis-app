"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MoreHorizontal, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  differenceInDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getToken } from "@/lib/auth-actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditTaskDialog } from "./edit-task-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskDetailsDialog } from "./task-details-dialog";

type TaskStatus = "todo" | "pending" | "done";

export type Task = {
  id: string;
  name: string;
  description?: string | null;
  status: TaskStatus;
  dueDate: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
};

type TaskCardProps = {
  task: Task;
  isOverlay?: boolean;
  className?: string;
  currentUserRole?: "owner" | "member";
  members?: any[];
  projectId?: string;
  onTaskUpdated?: () => void;
};

const formatDate = (dateString: string) => {
  if (!dateString) return { formattedDate: "Sem data", isOverdue: false };
  const date = parseISO(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let formattedDate: string;
  const isOverdue = isPast(date) && !isToday(date);

  if (isToday(date)) {
    formattedDate = "Hoje";
  } else if (isTomorrow(date)) {
    formattedDate = "Amanhã";
  } else if (isOverdue) {
    const days = differenceInDays(now, date);
    formattedDate = `${days} dia${days > 1 ? "s" : ""} atrás`;
  } else {
    formattedDate = format(date, "d 'de' MMM", { locale: ptBR });
  }

  return { formattedDate, isOverdue };
};

export function TaskCard({
  task,
  isOverlay,
  className,
  currentUserRole = "member",
  members = [],
  projectId = "",
  onTaskUpdated = () => {},
}: TaskCardProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const { formattedDate, isOverdue } = formatDate(task.dueDate);

  const handleAssignTask = async (assigneeId: string) => {
    if (!projectId || !onTaskUpdated) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("Token não encontrado.");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/${task.id}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assigneeId }),
        }
      );

      if (!response.ok) throw new Error("Falha ao atribuir a tarefa.");

      toast({
        title: "Sucesso!",
        description: "Tarefa atribuída com sucesso.",
      });
      onTaskUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleUnassignTask = async () => {
    if (!projectId || !onTaskUpdated) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Token não encontrado.");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/${task.id}/assign`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Falha ao remover atribuição.");

      toast({
        title: "Sucesso!",
        description: "Atribuição removida com sucesso.",
      });
      onTaskUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!projectId || !onTaskUpdated) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("Token não encontrado.");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/${task.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status !== 204) {
        throw new Error("Falha ao excluir a tarefa.");
      }

      toast({
        title: "Sucesso!",
        description: "Tarefa excluída com sucesso.",
      });
      onTaskUpdated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <TaskDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        task={task}
      />
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={task}
        projectId={projectId}
        onTaskUpdated={onTaskUpdated}
      />
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              tarefa <span className="font-bold">{task.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card
        id={task.id}
        className={cn(
          "hover:shadow-md transition-shadow",
          isOverlay && "ring-2 ring-primary",
          className
        )}
      >
        <CardHeader className="p-4">
          <CardTitle className="flex items-start justify-between">
            <span className="text-base font-semibold leading-tight tracking-tight pr-4">
              {task.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsDetailsDialogOpen(true)}>
                  Ver detalhes
                </DropdownMenuItem>
                {currentUserRole === "owner" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setIsEditDialogOpen(true)}
                    >
                      Editar Tarefa
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      {!task.assigneeId && (
                        <DropdownMenuSubTrigger>
                          Atribuir responsável
                        </DropdownMenuSubTrigger>
                      )}
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {members.map((member) => (
                            <DropdownMenuItem
                              key={member.user._id}
                              onSelect={() => handleAssignTask(member.user._id)}
                            >
                              {member.user.username}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    {task.assigneeId && (
                      <DropdownMenuItem
                        onSelect={handleUnassignTask}
                        className="text-destructive focus:text-destructive"
                      >
                        Remover responsável
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setIsDeleteDialogOpen(true)}
                    >
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={task.assignee.avatarUrl} />
                      <AvatarFallback>
                        {task.assignee.username
                          ? task.assignee.username[0].toUpperCase()
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.assignee.username}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="h-7 w-7 bg-muted-foreground/20">
                      <AvatarFallback className="text-xs text-muted-foreground">
                        ?
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Não atribuída</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <Badge
            variant={isOverdue ? "destructive" : "secondary"}
            className={cn(
              "text-xs flex items-center gap-1.5",
              isOverdue &&
                "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </Badge>
        </CardFooter>
      </Card>
    </>
  );
}

export function TaskCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardFooter>
    </Card>
  );
}
