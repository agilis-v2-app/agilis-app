import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="space-y-4">
        <h1 className="font-headline text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold tracking-tight">
          Página não encontrada
        </h2>
        <p className="max-w-md text-muted-foreground">
          Oops! Parece que a página que você está procurando não existe ou foi
          movida.
        </p>
      </div>
      <Button asChild className="mt-4">
        <Link href="/">Voltar para a página inicial</Link>
      </Button>
    </main>
  );
}
