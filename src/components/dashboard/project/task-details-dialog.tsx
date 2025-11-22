'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, FileText } from 'lucide-react';
import type { Task } from './task-card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TaskDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
};

const statusMap = {
  todo: {
    label: 'A Fazer',
    variant: 'secondary',
  },
  pending: {
    label: 'Em Andamento',
    variant: 'secondary',
  },
  done: {
    label: 'Concluída',
    variant: 'default',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
} as const;

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
}: TaskDetailsDialogProps) {
  if (!task) return null;

  const statusInfo = statusMap[task.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{task.name}</DialogTitle>
          <DialogDescription>
            Detalhes completos da tarefa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <FileText className="h-4 w-4" />
              Descrição
            </h3>
            <p className="text-foreground text-sm leading-relaxed min-h-[40px]">
              {task.description || (
                <span className="text-muted-foreground italic">
                  Nenhuma descrição fornecida.
                </span>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Data de Vencimento
              </h3>
              <p className="text-sm text-foreground">
                {task.dueDate
                  ? format(parseISO(task.dueDate), 'PPP', { locale: ptBR })
                  : 'N/D'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                Status
              </h3>
              <Badge variant={statusInfo.variant} className={statusInfo.className}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="h-4 w-4" />
              Responsável
            </h3>
            <p className="text-sm text-foreground">
              {task.assignee?.username || (
                <span className="text-muted-foreground italic">
                  Não atribuída
                </span>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
