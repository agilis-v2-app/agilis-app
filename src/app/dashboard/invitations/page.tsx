'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getToken } from '@/lib/auth-actions';
import { Check, X, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import { useInvitationStore } from '@/hooks/use-invitation-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Invitation = {
  _id: string;
  inviter: {
    _id: string;
    username: string;
  };
  project: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

export default function InvitationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { invitations, isLoading, fetchCount, removeInvitation } =
    useInvitationStore();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const handleAction = async (
    invitationId: string,
    action: 'accept' | 'reject'
  ) => {
    setIsProcessing(invitationId);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      const url = `${window.__ENV.NEXT_PUBLIC_API_URL}/invitations/${invitationId}/${action}`;
      const method = action === 'accept' ? 'POST' : 'DELETE';

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao processar o convite.');
      }

      toast({
        title: 'Sucesso!',
        description: `Convite ${
          action === 'accept' ? 'aceito' : 'rejeitado'
        } com sucesso.`,
      });

      if (action === 'accept') {
        router.push('/dashboard/projects');
      } else {
        // Remove the invitation from the list only on reject,
        // as accept will cause a navigation.
        removeInvitation(invitationId);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao processar convite',
        description: error.message,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const InvitationSkeleton = () => (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight">
          Convites Pendentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie aqui os convites para participar de novos projetos.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <InvitationSkeleton />
          <InvitationSkeleton />
          <InvitationSkeleton />
        </div>
      ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Inbox className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">
            Nenhum convite pendente
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando alguém te convidar para um projeto, o convite aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {invitations.map((invitation) => {
            const isThisOneProcessing = isProcessing === invitation._id;

            return (
              <Card
                key={invitation._id}
                className="flex flex-col"
                style={{ minHeight: '160px' }}
              >
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-semibold text-foreground truncate">
                            {invitation.project.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{invitation.project.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground truncate">
                            <span className="font-semibold text-foreground">
                              {invitation.inviter.username}
                            </span>{' '}
                            te convidou para o projeto.
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {invitation.inviter.username} te convidou para o
                            projeto.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-muted-foreground pt-1">
                      {formatDistanceToNow(parseISO(invitation.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-auto pt-4">
                    <Button
                      size="sm"
                      onClick={() => handleAction(invitation._id, 'accept')}
                      disabled={isThisOneProcessing}
                      className="flex-1 text-green-500 bg-green-500/10 hover:bg-green-500/20"
                    >
                      <Check className="h-4 w-4" />
                      <span>Aceitar</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction(invitation._id, 'reject')}
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
  );
}
