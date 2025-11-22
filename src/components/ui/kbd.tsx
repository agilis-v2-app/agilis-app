import * as React from 'react';
import { cn } from '@/lib/utils';

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'pointer-events-none inline-flex h-6 select-none items-center justify-center rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground',
          className
        )}
        {...props}
      />
    );
  }
);
Kbd.displayName = 'Kbd';

export { Kbd };
