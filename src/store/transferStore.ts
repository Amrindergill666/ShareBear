import { create } from 'zustand';
import { Transfer, TransferState, TransferRequest } from '../features/transfer/models';

interface TransferStateStore {
  transfers: Record<string, Transfer>;
  activeIncomingRequest: { transferId: string; request: TransferRequest } | null;
  addTransfer: (transfer: Transfer) => void;
  updateTransferStatus: (transferId: string, status: TransferState) => void;
  setActiveIncomingRequest: (request: { transferId: string; request: TransferRequest } | null) => void;
  setTransfers: (transfers: Record<string, Transfer>) => void;
}

export const useTransferStore = create<TransferStateStore>((set) => ({
  transfers: {},
  activeIncomingRequest: null,
  addTransfer: (transfer) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [transfer.transferId]: transfer,
      },
    })),
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
  setTransfers: (transfers) => set({ transfers }),
}));
