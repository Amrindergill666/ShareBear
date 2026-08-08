import { create } from 'zustand';
import { Transfer, TransferState, TransferRequest } from '../features/transfer/models';
import { TransferSession } from '../services/stream/TransferSession';

interface TransferStateStore {
  transfers: Record<string, Transfer>;
  activeIncomingRequest: { transferId: string; request: TransferRequest } | null;
  activeSession: TransferSession | null;
  addTransfer: (transfer: Transfer) => void;
  removeTransfer: (transferId: string) => void;
  updateTransferStatus: (transferId: string, status: TransferState) => void;
  setActiveIncomingRequest: (request: { transferId: string; request: TransferRequest } | null) => void;
  setActiveSession: (session: TransferSession | null) => void;
  updateActiveSessionProgress: (
    bytesTransferred: number,
    percentage: number,
    speed: number,
    eta: number
  ) => void;
  setTransfers: (transfers: Record<string, Transfer>) => void;
}

export const useTransferStore = create<TransferStateStore>((set) => ({
  transfers: {},
  activeIncomingRequest: null,
  activeSession: null,
  addTransfer: (transfer) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transfer.transferId]: transfer,
      },
    })),
  removeTransfer: (transferId) =>
    set((state) => {
      const { [transferId]: _, ...rest } = state.transfers;
      return { transfers: rest };
    }),
  updateTransferStatus: (transferId, status) =>
    set((state) => {
      const existing = state.transfers[transferId];
      if (!existing) return state;
      return {
        transfers: {
          ...state.transfers,
          [transferId]: {
            ...existing,
            status,
          },
        },
      };
    }),
  setActiveIncomingRequest: (request) => set({ activeIncomingRequest: request }),
  setActiveSession: (session) => set({ activeSession: session }),
  updateActiveSessionProgress: (bytesTransferred, percentage, speed, eta) =>
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          bytesTransferred,
          percentage,
          speed,
          eta,
        },
      };
    }),
  setTransfers: (transfers) => set({ transfers }),
}));
