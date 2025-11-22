import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Rocket } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 font-headline text-xl font-bold',
        className
      )}
    >
      <Rocket className="h-6 w-6 text-primary" />
      <span className="text-foreground">Agilis</span>
    </Link>
  );
}
