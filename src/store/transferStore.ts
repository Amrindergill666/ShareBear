import { create } from 'zustand';

export interface TransferItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number; // 0 to 100
  speed: number; // bytes/sec
  eta: number; // seconds
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  direction: 'send' | 'receive';
  peerDeviceName: string;
  error?: string;
}

interface TransferState {
  transfers: Record<string, TransferItem>;
  addTransfer: (transfer: TransferItem) => void;
  updateProgress: (id: string, progress: number, speed: number, eta: number) => void;
  updateStatus: (id: string, status: TransferItem['status'], error?: string) => void;
  clearHistory: () => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: {},
  addTransfer: (transfer) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transfer.id]: transfer,
      },
    })),
  updateProgress: (id, progress, speed, eta) =>
    set((state) => {
      if (!state.transfers[id]) return state;
      return {
        transfers: {
          ...state.transfers,
          [id]: {
            ...state.transfers[id],
            progress,
            speed,
            eta,
          },
        },
      };
    }),
  updateStatus: (id, status, error) =>
    set((state) => {
      if (!state.transfers[id]) return state;
      return {
        transfers: {
          ...state.transfers,
          [id]: {
            ...state.transfers[id],
            status,
            error,
          },
        },
      };
    }),
  clearHistory: () =>
    set((state) => {
      const activeTransfers = { ...state.transfers };
      Object.keys(activeTransfers).forEach((key) => {
        const item = activeTransfers[key];
        if (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') {
          delete activeTransfers[key];
        }
      });
      return { transfers: activeTransfers };
    }),
}));
