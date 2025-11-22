
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getToken } from '@/lib/auth-actions';
import { Loader2, Download, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangePasswordDialog } from '@/components/dashboard/settings/change-password-dialog';

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(32, 'O nome de usuário deve ter no máximo 32 caracteres.')
    .trim()
    .refine(
      (val) => /^[a-zA-Z0-9_.-]+$/.test(val),
      'O nome de usuário pode conter apenas letras, números e os caracteres _, . e -'
    ),
  email: z.string().email('Formato de email inválido.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type User = {
  username: string;
  email: string;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('Token de autenticação não encontrado.');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error('Falha ao buscar dados do usuário.');
        const userData = await response.json();
        setUser(userData);
        profileForm.reset({
          username: userData.username,
          email: userData.email,
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar os dados do usuário.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [profileForm, toast]);

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSubmittingProfile(true);

    const changedData: Partial<ProfileFormValues> = {};
    if (data.username !== user.username) {
      changedData.username = data.username;
    }
    if (data.email !== user.email) {
      changedData.email = data.email;
    }

    if (Object.keys(changedData).length === 0) {
      toast({ description: 'Nenhuma alteração foi feita.' });
      setIsSubmittingProfile(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(changedData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409 && responseData.conflicts) {
          responseData.conflicts.forEach(
            (field: keyof ProfileFormValues) => {
              profileForm.setError(field, {
                type: 'server',
                message: `Este ${
                  field === 'username' ? 'nome de usuário' : 'email'
                } já está em uso.`,
              });
            }
          );
          throw new Error('Corrija os campos indicados.');
        } else {
          throw new Error(responseData.message || 'Falha ao atualizar perfil.');
        }
      }

      toast({
        title: 'Sucesso!',
        description: 'Seu perfil foi atualizado.',
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: error.message,
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Token de autenticação não encontrado.');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok)
        throw new Error('Falha ao exportar os dados. Tente novamente.');

      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'agilis_dados.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso!',
        description: 'Seus dados foram exportados.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar dados',
        description: error.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isProfileFormDirty = profileForm.formState.isDirty;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight">
            Ajustes da Conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações de perfil e preferências.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight">
            Ajustes da Conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas informações de perfil e preferências.
          </p>
        </div>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>
                  Esta informação será exibida publicamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de usuário</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={!isProfileFormDirty || isSubmittingProfile}
                >
                  {isSubmittingProfile && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar alterações
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
        
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações que afetam sua conta e segurança. Proceda com cautela.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-foreground">
                Alterar Senha
              </p>
              <p className="text-sm text-muted-foreground">
                Após a alteração, você pode precisar fazer login novamente.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                Alterar Senha
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Exportar meus dados
              </p>
              <p className="text-sm text-muted-foreground">
                Baixe um arquivo JSON com todas as suas informações.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar Dados
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
