'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  username: z
    .string()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
    .max(32, 'O nome de usuário deve ter no máximo 32 caracteres.')
    .trim(),
  email: z.string().email('Formato de email inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type FormSchema = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormSchema) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${window.__ENV.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        }
      );

      const errorData = await response.json();

      if (!response.ok) {
        if (response.status === 409 && errorData.conflicts) {
          errorData.conflicts.forEach((field: keyof FormSchema) => {
            if (field === 'username' || field === 'email') {
              form.setError(field, {
                type: 'server',
                message: `Este ${
                  field === 'username' ? 'nome de usuário' : 'email'
                } já está em uso.`,
              });
            }
          });
          toast({
            variant: 'destructive',
            title: 'Erro ao criar conta',
            description: 'Por favor, corrija os campos indicados.',
          });
        } else {
          throw new Error(errorData.message || 'Falha ao criar a conta.');
        }
      } else {
        toast({
          title: 'Sucesso!',
          description: 'Sua conta foi criada. Redirecionando para o login...',
        });
        router.push('/signin');
      }
    } catch (error: any) {
      if (!error.message.includes('already in use')) {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar conta',
          description:
            error.message || 'Ocorreu um problema, tente novamente.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in-50 slide-in-from-bottom-8 duration-500">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">
              Crie sua conta
            </CardTitle>
            <CardDescription>
              É rápido e fácil. Comece a organizar seus projetos hoje mesmo.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="seuusuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar conta
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{' '}
                  <Link
                    href="/signin"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Acesse aqui
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </main>
  );
}
