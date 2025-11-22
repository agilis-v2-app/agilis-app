import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  KanbanSquare,
  LayoutGrid,
  Users,
  FolderPlus,
  LayoutList,
  UsersRound,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const features = [
  {
    icon: <KanbanSquare className="h-8 w-8 text-primary" />,
    title: 'Quadros Kanban',
    description:
      'Visualize seu progresso com quadros Kanban flexíveis e intuitivos.',
  },
  {
    icon: <LayoutGrid className="h-8 w-8 text-primary" />,
    title: 'Gerenciamento de Projetos',
    description: 'Crie e organize múltiplos projetos com facilidade.',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: 'Estatísticas e Métricas',
    description:
      'Acompanhe o desempenho da sua equipe com gráficos e relatórios detalhados.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Colaboração em Equipe',
    description:
      'Convide membros para seus projetos e colabore em tempo real.',
  },
];

const howItWorksSteps = [
  {
    icon: <FolderPlus className="h-10 w-10 text-primary" />,
    title: '1. Crie seu Projeto',
    description:
      'Dê um nome ao seu projeto, convide sua equipe e defina seus objetivos iniciais em um só lugar.',
  },
  {
    icon: <LayoutList className="h-10 w-10 text-primary" />,
    title: '2. Adicione e Organize Tarefas',
    description:
      'Use quadros Kanban para criar, atribuir e mover tarefas de forma visual e intuitiva.',
  },
  {
    icon: <UsersRound className="h-10 w-10 text-primary" />,
    title: '3. Acompanhe e Colabore',
    description:
      'Monitore o progresso em tempo real, comunique-se com sua equipe e atinja seus objetivos com mais rapidez.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative h-dvh w-full animate-in fade-in duration-500">
          <div className="container mx-auto flex h-full flex-col items-center justify-center gap-6 px-4 text-center md:px-6">
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Otimize seu fluxo de trabalho com{' '}
                <span className="text-primary">Agilis</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
                A ferramenta definitiva para gerenciamento de projetos e tarefas.
                Colabore, planeje e execute com mais eficiência.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Comece Gratuitamente
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">Saber Mais</Link>
              </Button>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <Link href="#features" aria-label="Rolar para a próxima seção">
              <ChevronDown className="h-8 w-8 animate-bounce text-primary" />
            </Link>
          </div>
        </section>

        <section
          id="features"
          className="container mx-auto flex min-h-dvh animate-in fade-in slide-in-from-bottom-12 duration-700"
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 py-16 px-4 md:py-24 md:px-6">
            <div className="space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Agilis oferece um conjunto completo de ferramentas para levar sua
                produtividade para o próximo nível.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-6 pt-8 sm:grid-cols-2">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-primary/20 hover:shadow-lg"
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline text-xl">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="flex min-h-dvh w-full bg-card/50 animate-in fade-in slide-in-from-bottom-16 duration-900"
        >
          <div className="container mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 py-16 px-4 md:py-24 md:px-6">
            <div className="space-y-4 text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Comece a usar em 3 passos simples
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                O Agilis foi projetado para ser intuitivo e fácil de usar. Veja
                como começar a transformar sua gestão de projetos.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-3">
              {howItWorksSteps.map((step) => (
                <div
                  key={step.title}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    {step.icon}
                  </div>
                  <h3 className="font-headline text-xl font-bold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
