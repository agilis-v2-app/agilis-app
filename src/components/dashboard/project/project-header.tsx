
'use client';

import { useState } from 'react';
import { AvatarGroup } from '@/components/dashboard/avatar-group';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewTaskDialog } from '@/components/dashboard/project/new-task-dialog';
import type { Member } from '@/app/dashboard/projects/[id]/board/page';

type ProjectHeaderProps = {
  projectId: string;
  name: string;
  description: string;
  members: Member[];
  currentUserRole: 'owner' | 'member';
  onTaskCreated: () => void;
};

export function ProjectHeader({
  projectId,
  name,
  description,
  members,
  currentUserRole,
  onTaskCreated,
}: ProjectHeaderProps) {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const memberAvatars = members.map((member: Member) => ({
    src: '',
    fallback: (member.user.username || member.user.email || '?')[0].toUpperCase(),
  }));

  const handleTaskCreated = () => {
    setIsNewTaskOpen(false);
    onTaskCreated();
  };

  return (
    <>
      <NewTaskDialog
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        projectId={projectId}
        onTaskCreated={handleTaskCreated}
        members={members}
        currentUserRole={currentUserRole}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="font-headline text-2xl font-bold tracking-tight">
            {name}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          <AvatarGroup users={memberAvatars} />
          <Button onClick={() => setIsNewTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
          </Button>
        </div>
      </div>
    </>
  );
}
