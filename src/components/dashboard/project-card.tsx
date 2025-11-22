import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarGroup } from './avatar-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { Crown } from 'lucide-react';

type ProjectCardProps = {
  name: string;
  isOwner?: boolean;
  tasks: {
    todo: number;
    pending: number;
    done: number;
  };
  users: {
    src: string;
    fallback: string;
  }[];
  className?: string;
};

const MultiColorProgressBar = ({
  values,
}: {
  values: { color: string; value: number }[];
}) => {
  const total = values.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" />
    );
  }

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full">
      {values.map((item, index) => {
        const percentage = (item.value / total) * 100;
        return (
          <div
            key={index}
            style={{ width: `${percentage}%` }}
            className={`h-full ${item.color}`}
          />
        );
      })}
    </div>
  );
};

export function ProjectCard({
  name,
  isOwner,
  tasks,
  users,
  className,
}: ProjectCardProps) {
  const progressValues = [
    { value: tasks.done, color: 'bg-green-500' },
    { value: tasks.pending, color: 'bg-yellow-500' },
    { value: tasks.todo, color: 'bg-red-500' },
  ];

  return (
    <Card
      className={cn(
        'flex flex-col h-full transform-gpu transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-primary/20 hover:shadow-lg',
        className
      )}
    >
      <CardHeader>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                )}
                <CardTitle className="truncate font-headline text-lg tracking-tight">
                  {name}
                </CardTitle>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span>Concluída</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span>A fazer</span>
            </div>
          </div>
          <MultiColorProgressBar values={progressValues} />
        </div>
        <div className="mt-4">
          <AvatarGroup users={users} />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectCardSkeleton() {
  return (
    <Card className="flex flex-col h-[210px]">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between">
        <div>
          <div className="mb-2 flex justify-between text-xs">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="mt-4 flex -space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
