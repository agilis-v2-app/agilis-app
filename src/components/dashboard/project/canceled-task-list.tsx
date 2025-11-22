'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import type { Task } from './task-card';
import { TaskCard } from './task-card';

type CanceledTaskListProps = {
  tasks: Task[];
};

export function CanceledTaskList({ tasks }: CanceledTaskListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <XCircle className="h-5 w-5 text-muted-foreground" />
          Tarefas Canceladas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} className="opacity-70" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}