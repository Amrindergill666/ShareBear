import { storageHelpers, STORAGE_KEYS } from '../../storage/storage';
import { Transfer } from './models';

/**
 * Handles reading and writing Transfer objects to persisted local MMKV storage.
 */
export const TransferRepository = {
  /**
   * Retrieves all historical transfers.
   */
  getHistory: (): Transfer[] => {
    return storageHelpers.getObject<Transfer[]>(STORAGE_KEYS.TRANSFER_HISTORY) || [];
  },

  /**
   * Saves or updates a Transfer in the persisted history.
   */
  saveTransfer: (transfer: Transfer): void => {
    const history = TransferRepository.getHistory();
    const index = history.findIndex((t) => t.transferId === transfer.transferId);
    if (index !== -1) {
      history[index] = transfer;
    } else {
      history.unshift(transfer); // Newest transfers at the top
    }
    storageHelpers.setObject(STORAGE_KEYS.TRANSFER_HISTORY, history);
  },

  /**
   * Deletes a Transfer from the persisted history.
   */
  deleteTransfer: (transferId: string): void => {
    const history = TransferRepository.getHistory();
    const updated = history.filter((t) => t.transferId !== transferId);
    storageHelpers.setObject(STORAGE_KEYS.TRANSFER_HISTORY, updated);
  },

  /**
   * Clears all transfer log history.
   */
  clearHistory: (): void => {
    storageHelpers.delete(STORAGE_KEYS.TRANSFER_HISTORY);
  },
};
