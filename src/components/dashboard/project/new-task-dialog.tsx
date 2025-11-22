'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getToken } from '@/lib/auth-actions';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Member } from '@/app/dashboard/projects/[id]/board/page';

const newTaskSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome da tarefa é obrigatório.')
    .max(255, 'O nome da tarefa deve ter no máximo 255 caracteres.'),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .optional(),
  status: z.enum(['todo', 'pending', 'done']),
  dueDate: z.date({
    required_error: 'A data de vencimento é obrigatória.',
  }),
  assigneeId: z.string().optional(),
});

type NewTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onTaskCreated: () => void;
  members: Member[];
  currentUserRole: 'owner' | 'member';
};

export function NewTaskDialog({
  open,
  onOpenChange,
  projectId,
  onTaskCreated,
  members,
  currentUserRole,
}: NewTaskDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof newTaskSchema>>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'todo',
      assigneeId: '',
    },
  });

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');
      const response = await fetch(
        `${window.__ENV.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks/${taskId}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assigneeId }),
        }
      );
      if (!response.ok) {
        // We don't throw here, as the main task was created.
        // We just notify the user.
        toast({
          variant: 'destructive',
          title: 'Erro ao atribuir tarefa',
          description: 'A tarefa foi criada, mas falhou ao ser atribuída.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atribuir tarefa',
        description: error.message,
      });
    }
  };

  async function onSubmit(values: z.infer<typeof newTaskSchema>) {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      const taskData = {
        name: values.name,
        description: values.description,
        status: values.status,
        dueDate: values.dueDate.toISOString(),
      };

      const response = await fetch(
        `${window.__ENV.NEXT_PUBLIC_API_URL}/projects/${projectId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        }
      );

      const createdTask = await response.json();

      if (!response.ok) {
        throw new Error(createdTask.message || 'Falha ao criar a tarefa.');
      }

      toast({
        title: 'Sucesso!',
        description: 'A tarefa foi criada com sucesso.',
      });

      // If an assignee was selected (and it's not the placeholder value), perform the assignment
      if (values.assigneeId && values.assigneeId !== 'unassigned') {
        await handleAssignTask(createdTask._id, values.assigneeId);
      }

      form.reset();
      onTaskCreated();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar tarefa',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) form.reset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova tarefa para o seu projeto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Tarefa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Desenvolver a tela de login"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os detalhes e requisitos da tarefa."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="pending">Em Andamento</SelectItem>
                        <SelectItem value="done">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {currentUserRole === 'owner' && (
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atribuir a (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um membro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Não atribuir</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.user._id} value={member.user._id}>
                            {member.user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Tarefa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
