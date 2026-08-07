import { useTransferStore } from '../../store/transferStore';
import { TransferState } from './models';
import { TransferRepository } from './TransferRepository';

/**
 * Enforces valid state transitions in the transfer handshake lifecycle.
 */
export const TransferStateMachine = {
  /**
   * Transition matrix defining allowed next states.
   */
  allowedTransitions: {
    REQUESTED: ['WAITING_FOR_USER', 'ACCEPTED', 'REJECTED', 'FAILED'],
    WAITING_FOR_USER: ['ACCEPTED', 'REJECTED', 'FAILED'],
    ACCEPTED: ['COMPLETED', 'FAILED'],
    REJECTED: [],
    COMPLETED: [],
    FAILED: [],
  } as Record<TransferState, TransferState[]>,

  /**
   * Attempts to transition a transfer to a new state, updating the Zustand store and persisted history.
   */
  transition: (transferId: string, newState: TransferState): void => {
    const store = useTransferStore.getState();
    const transfer = store.transfers[transferId];

    if (!transfer) {
      console.warn(`[TransferStateMachine] Transfer ${transferId} not found in store.`);
      return;
    }

    const current = transfer.status;
    const allowed = TransferStateMachine.allowedTransitions[current];

    if (!allowed || !allowed.includes(newState)) {
      console.warn(
        `[TransferStateMachine] Invalid state transition requested from ${current} to ${newState} for ${transferId}.`
      );
      return;
    }

    console.log(`[TransferStateMachine] Transitioning ${transferId}: ${current} -> ${newState}`);

    // Update Zustand state
    store.updateTransferStatus(transferId, newState);

    // Persist to repository
    const updatedTransfer = {
      ...transfer,
      status: newState,
    };
    TransferRepository.saveTransfer(updatedTransfer);
  },
};
