
'use client';

import { create } from 'zustand';
import { getToken } from '@/lib/auth-actions';
import type { Task } from '@/components/dashboard/project/task-card';
import type { Member } from '@/app/dashboard/projects/[id]/board/page';

type Stats = {
  membersCount: number;
  tasksCount: number;
  tasksByStatus: {
    todo?: number;
    pending?: number;
    done?: number;
  };
  tasksAssignedCount: number;
  tasksUnassignedCount: number;
  overdueCount: number;
  pendingInvitations: number;
};

type ProjectData = {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  members: Member[];
};

type CurrentUser = {
  _id: string;
  username: string;
  email: string;
};

type ProjectState = {
  project: ProjectData | null;
  currentUser: CurrentUser | null;
  stats: Stats | null;
  isLoading: boolean;
  fetchProjectById: (id: string) => Promise<void>;
  setProject: (project: ProjectData | null) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
};

const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  currentUser: null,
  stats: null,
  isLoading: true,
  fetchProjectById: async (id: string) => {
    // Clear previous data and set loading state atomically.
    set({ project: null, stats: null, isLoading: true });
    try {
      const token = await getToken();
      if (!token) throw new Error('Token não encontrado.');
      const headers = { Authorization: `Bearer ${token}` };

      const [projectResponse, userResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}/stats`, { headers }),
      ]);

      if (!projectResponse.ok) throw new Error('Falha ao buscar o projeto.');
      if (!userResponse.ok)
        throw new Error('Falha ao buscar dados do usuário.');
      if (!statsResponse.ok) throw new Error('Falha ao buscar as métricas.');

      const projectData = await projectResponse.json();
      const userData = await userResponse.json();
      const statsData = await statsResponse.json();

      const memberMap = new Map(
        projectData.members.map((member: Member) => [member.user._id, member.user])
      );

      const formattedProject: ProjectData = {
        id: projectData._id,
        name: projectData.name,
        description: projectData.description,
        tasks: projectData.tasks.map((task: any) => {
          const assigneeUser = task.assigneeId
            ? memberMap.get(task.assigneeId)
            : undefined;
          return {
            id: task._id,
            name: task.name,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate,
            assigneeId: task.assigneeId,
            assignee: assigneeUser
              ? {
                  id: assigneeUser._id,
                  username: assigneeUser.username,
                }
              : undefined,
          };
        }),
        members: projectData.members,
      };

      // Set all new data and turn off loading state.
      set({
        project: formattedProject,
        currentUser: userData,
        stats: statsData,
      });
    } catch (error) {
      console.error(error);
      set({ project: null, stats: null });
    } finally {
      set({ isLoading: false });
    }
  },
  setProject: (project) => set({ project }),
  setCurrentUser: (user) => set({ currentUser: user }),
}));

export default useProjectStore;
