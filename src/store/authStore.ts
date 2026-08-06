import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  username: string | null;
  setAuth: (userId: string, username: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  username: null,
  setAuth: (userId, username) => set({ userId, username }),
  clearAuth: () => set({ userId: null, username: null }),
}));
