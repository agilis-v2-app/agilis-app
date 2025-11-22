'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth-actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ShieldAlert,
  UserPlus,
  Crown,
  Trash2,
  Clock,
  Search,
} from 'lucide-react';
import type { Member } from '@/app/dashboard/projects/[id]/board/page';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Fuse from 'fuse.js';
import { Badge } from '@/components/ui/badge';
import useProjectStore from '@/hooks/use-project-store';
import { Textarea } from '@/components/ui/textarea';

type User = {
  _id: string;
};

type SentInvitation = {
  _id: string;
  invitee: {
    _id: string;
    username: string;
  };
  createdAt: string;
};

const projectUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do projeto é obrigatório.')
    .max(50, 'O nome do projeto deve ter no máximo 50 caracteres.'),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres.')
    .nullable()
    .optional(),
});

const inviteMemberSchema = z.object({
  username: z
    .string()
    .min(1, 'O nome de usuário é obrigatório.')
    .max(50, 'O nome do usuário deve ter no máximo 50 caracteres.'),
});

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { id: projectId } = params;
  const { toast } = useToast();

  const { project, currentUser, isLoading, fetchProjectById } =
    useProjectStore();

  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [sentInvitations, setSentInvitations] = useState<SentInvitation[]>([]);
  const [invitationToCancel, setInvitationToCancel] =
    useState<SentInvitation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId as string);
    }
  }, [projectId, fetchProjectById]);

  useEffect(() => {
    if (project && currentUser) {
      const owner = project.members.find((m: Member) => m.role === 'owner');
      const currentUserIsOwner = owner?.user._id === currentUser._id;
      setIsOwner(currentUserIsOwner);

      if (!currentUserIsOwner) {
        router.replace(`/dashboard/projects/${projectId}`);
      }

      projectUpdateForm.reset({
        name: project.name,
        description: project.description,
      });

      fetchSentInvitations();
    }
  }, [project, currentUser, router, projectId]);

  const projectUpdateForm = useForm<z.infer<typeof projectUpdateSchema>>({
    resolver: zodResolver(projectUpdateSchema),
    mode: 'onChange',
  });

  const inviteForm = useForm<z.infer<typeof inviteMemberSchema>>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { username: '' },
  });

  const fetchSentInvitations = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Token não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/invitations/sent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Falha ao buscar convites enviados.');

      const data = await response.json();
      setSentInvitations(data.invitations || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar convites',
        description: error.message,
      });
    }
  };

  const memberFuse = useMemo(() => {
    if (!project) return null;
    return new Fuse(project.members, {
      keys: ['user.username', 'user.email'],
      threshold: 0.4,
    });
  }, [project?.members]);

  const filteredMembers = useMemo(() => {
    if (!project) return [];
    if (!searchQuery || !memberFuse) return project.members;
    return memberFuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, project?.members, memberFuse]);

  const errorMessages: { [key: string]: string } = {
    user_not_found: 'Usuário não encontrado com este nome.',
    already_member: 'Este usuário já é membro do projeto.',
    already_invited: 'Um convite já foi enviado para este usuário.',
  };

  async function onProjectUpdateSubmit(
    values: z.infer<typeof projectUpdateSchema>
  ) {
    if (!project) return;
    setIsSubmittingProject(true);

    const changedData: Partial<z.infer<typeof projectUpdateSchema>> = {};
    if (values.name !== project.name) {
      changedData.name = values.name;
    }
    if (values.description !== project.description) {
      changedData.description = values.description;
    }

    if (Object.keys(changedData).length === 0) {
      toast({ description: 'Nenhuma alteração foi feita.' });
      setIsSubmittingProject(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(changedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Falha ao atualizar o projeto.'
        );
      }

      toast({
        title: 'Sucesso!',
        description: 'As informações do projeto foram atualizadas.',
      });
      fetchProjectById(projectId as string);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar projeto',
        description: error.message,
      });
    } finally {
      setIsSubmittingProject(false);
    }
  }

  async function onInviteSubmit(values: z.infer<typeof inviteMemberSchema>) {
    setIsActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/invitations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ inviteeUsername: values.username }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorMessages[errorData.reason] ||
          'Falha ao convidar o membro. Tente novamente.';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Sucesso!',
        description: 'O membro foi convidado para o projeto.',
      });
      inviteForm.reset();
      fetchSentInvitations(); // Refresh sent invitations list
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao convidar membro',
        description: error.message,
      });
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return;

    setIsActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members/${memberToRemove.user._id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: 'Sucesso!',
        description: 'O membro foi removido do projeto.',
      });
      fetchProjectById(projectId as string);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover membro',
        description: error.message,
      });
    } finally {
      setIsActionLoading(false);
      setMemberToRemove(null);
    }
  }

  async function handleCancelInvitation() {
    if (!invitationToCancel) return;
    setIsActionLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token não encontrado.');

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/invitations/${invitationToCancel._id}/cancel`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Sucesso!', description: 'O convite foi cancelado.' });
      fetchSentInvitations();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar convite',
        description: error.message,
      });
    } finally {
      setIsActionLoading(false);
      setInvitationToCancel(null);
    }
  }

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status !== 204) throw new Error('Falha ao excluir.');
      toast({ title: 'Sucesso!', description: 'O projeto foi excluído.' });
      router.push('/dashboard/projects');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir projeto',
        description: error.message,
      });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const getRoleIcon = (role: string) =>
    role === 'owner' ? <Crown className="h-4 w-4 text-yellow-500" /> : null;

  if (isLoading || !project) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <Form {...projectUpdateForm}>
          <form
            onSubmit={projectUpdateForm.handleSubmit(onProjectUpdateSubmit)}
          >
            <Card>
              <CardHeader>
                <CardTitle>Informações do Projeto</CardTitle>
                <CardDescription>
                  Atualize o nome e a descrição do seu projeto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={projectUpdateForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Projeto</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmittingProject} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectUpdateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          disabled={isSubmittingProject}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    isSubmittingProject || !projectUpdateForm.formState.isDirty
                  }
                >
                  {isSubmittingProject && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Membros e Convites</CardTitle>
            <CardDescription>
              Adicione membros, gerencie a equipe e veja os convites pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Membros Atuais
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar membro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div
                      key={member.user._id}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {(
                            member.user.username || member.user.email
                          )[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-normal truncate">
                            {member.user.username}
                          </p>
                          {member.user._id === currentUser?._id && (
                            <Badge
                              variant="secondary"
                              className="px-2 py-0 text-xs"
                            >
                              você
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-normal truncate">
                          {member.user.email}
                        </p>
                      </div>
                      {getRoleIcon(member.role)}
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setMemberToRemove(member)}
                          disabled={isActionLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum membro encontrado.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Convites Pendentes
              </h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {sentInvitations.length > 0 ? (
                  sentInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {invitation.invitee.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-normal truncate">
                          {invitation.invitee.username}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 leading-normal">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(
                            parseISO(invitation.createdAt),
                            {
                              addSuffix: true,
                              locale: ptBR,
                            }
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setInvitationToCancel(invitation)}
                        disabled={isActionLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum convite pendente.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">
                Convidar Novo Membro
              </h3>
              <Form {...inviteForm}>
                <form
                  onSubmit={inviteForm.handleSubmit(onInviteSubmit)}
                  className="flex items-start gap-3"
                >
                  <FormField
                    control={inviteForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Nome de usuário"
                            {...field}
                            disabled={isActionLoading}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isActionLoading}>
                    {isActionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span className="sr-only sm:not-sr-only sm:ml-2">
                      Convidar
                    </span>
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Essas ações são irreversíveis. Tenha certeza antes de prosseguir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">
              Excluir este projeto
            </p>
            <p className="text-sm text-muted-foreground">
              Uma vez que você exclui um projeto, não há como voltar atrás.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Excluir Projeto
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(isOpen) => !isOpen && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o membro{' '}
              <span className="font-bold">{memberToRemove?.user.username}</span>{' '}
              do projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!invitationToCancel}
        onOpenChange={(isOpen) => !isOpen && setInvitationToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o convite para{' '}
              <span className="font-bold">
                {invitationToCancel?.invitee.username}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>
              Manter
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              projeto <span className="font-bold">{project?.name}</span> e todas
              as suas tarefas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, excluir projeto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
