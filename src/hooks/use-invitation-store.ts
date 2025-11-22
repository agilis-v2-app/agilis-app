'use client';

import { create } from 'zustand';
import { getToken } from '@/lib/auth-actions';

type Invitation = {
  _id: string;
  inviter: {
    _id: string;
    username: string;
  };
  project: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

type InvitationState = {
  invitations: Invitation[];
  count: number;
  isLoading: boolean;
  fetchCount: () => Promise<void>;
  removeInvitation: (invitationId: string) => void;
};

export const useInvitationStore = create<InvitationState>((set) => ({
  invitations: [],
  count: 0,
  isLoading: true,
  fetchCount: async () => {
    set({ isLoading: true });
    try {
      const token = await getToken();
      if (!token) {
        set({ count: 0, invitations: [], isLoading: false });
        return;
      }

      const response = await fetch(
        `${window.__ENV.NEXT_PUBLIC_API_URL}/users/me/invitations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        set({
          count: data.invitations.length || 0,
          invitations: data.invitations || [],
          isLoading: false,
        });
      } else {
        set({ count: 0, invitations: [], isLoading: false });
      }
    } catch (error) {
      set({ count: 0, invitations: [], isLoading: false });
    }
  },
  removeInvitation: (invitationId: string) =>
    set((state) => ({
      invitations: state.invitations.filter((inv) => inv._id !== invitationId),
      count: Math.max(0, state.count - 1),
    })),
}));
