import { create } from 'zustand';

interface ServerState {
  isRunning: boolean;
  port: number;
  requestsReceived: number;
  lastRequestIp: string;
  uptime: number;
  setServerStats: (stats: Partial<Omit<ServerState, 'setServerStats' | 'reset'>>) => void;
  reset: () => void;
}

export const useServerStore = create<ServerState>((set) => ({
  isRunning: false,
  port: 0,
  requestsReceived: 0,
  lastRequestIp: 'none',
  uptime: 0,
  setServerStats: (stats) => set((state) => ({ ...state, ...stats })),
  reset: () => set({
    isRunning: false,
    port: 0,
    requestsReceived: 0,
    lastRequestIp: 'none',
    uptime: 0,
  }),
}));
