import { NetworkEventEmitter } from '../../native/NetworkModule';
import { useTransferStore } from '../../store/transferStore';
import { TransferRepository } from '../../features/transfer/TransferRepository';
import { Transfer } from '../../features/transfer/models';

let progressSubscription: any = null;
let successSubscription: any = null;
let errorSubscription: any = null;

let transferStartTime = 0;

export const ProgressEmitter = {
  startListening: () => {
    ProgressEmitter.stopListening();
    console.log('[ProgressEmitter] Starting native transfer event listeners');

    progressSubscription = NetworkEventEmitter.addListener('TransferProgress', (event) => {
      const { transferId, bytesSent, totalBytes, direction } = event;
      const now = Date.now();

      const session = useTransferStore.getState().activeSession;
      if (!session || session.transferId !== transferId) {
        // Initialize new session (e.g. for incoming downloads or newly started uploads)
        const transfers = useTransferStore.getState().transfers;
        const transfer = transfers[transferId];
        const fileName = transfer?.files[0]?.name || 'unknown';
        const mimeType = transfer?.files[0]?.mime || 'application/octet-stream';

        console.log(`[ProgressEmitter] Initializing active session for ${transferId} (${direction})`);
        
        useTransferStore.getState().setActiveSession({
          transferId,
          fileName,
          fileSize: totalBytes,
          mimeType,
          bytesTransferred: bytesSent,
          percentage: totalBytes > 0 ? (bytesSent / totalBytes) * 100 : 0,
          speed: 0,
          eta: 0,
          direction: direction as 'upload' | 'download',
          status: 'transferring',
        });
        
        transferStartTime = now;
        return;
      }

      // Calculate speed and ETA
      const elapsedTotalSeconds = (now - transferStartTime) / 1000;
      const speed = elapsedTotalSeconds > 0 ? bytesSent / elapsedTotalSeconds : 0;
      const remainingBytes = totalBytes - bytesSent;
      const eta = speed > 0 ? remainingBytes / speed : 0;
      const percentage = totalBytes > 0 ? (bytesSent / totalBytes) * 100 : 0;

      useTransferStore.getState().updateActiveSessionProgress(
        bytesSent,
        percentage,
        speed,
        eta
      );
    });

    successSubscription = NetworkEventEmitter.addListener('TransferSuccess', (event) => {
      const { transferId, filePath, fileSize } = event;
      console.log(`[ProgressEmitter] TransferSuccess received for ${transferId}. Path: ${filePath}`);

      const session = useTransferStore.getState().activeSession;
      if (session && session.transferId === transferId) {
        useTransferStore.getState().setActiveSession({
          ...session,
          status: 'completed',
          percentage: 100,
        });
        setTimeout(() => {
          const cur = useTransferStore.getState().activeSession;
          if (cur?.transferId === transferId) {
            useTransferStore.getState().setActiveSession(null);
          }
        }, 1800);
      }

      // Update transfer history status to COMPLETED
      useTransferStore.getState().updateTransferStatus(transferId, 'COMPLETED');
      
      const transfer = useTransferStore.getState().transfers[transferId];
      if (transfer) {
        const updated: Transfer = { ...transfer, status: 'COMPLETED' };
        TransferRepository.saveTransfer(updated);
      }
    });

    errorSubscription = NetworkEventEmitter.addListener('TransferError', (event) => {
      const { transferId, error } = event;
      console.error(`[ProgressEmitter] TransferError received for ${transferId}:`, error);

      const session = useTransferStore.getState().activeSession;
      if (session && session.transferId === transferId) {
        useTransferStore.getState().setActiveSession({
          ...session,
          status: 'failed',
          error: error || 'Transfer failed',
        });
        setTimeout(() => {
          const cur = useTransferStore.getState().activeSession;
          if (cur?.transferId === transferId) {
            useTransferStore.getState().setActiveSession(null);
          }
        }, 2500);
      }

      // Update transfer history status to FAILED
      useTransferStore.getState().updateTransferStatus(transferId, 'FAILED');
      
      const transfer = useTransferStore.getState().transfers[transferId];
      if (transfer) {
        const updated: Transfer = { ...transfer, status: 'FAILED' };
        TransferRepository.saveTransfer(updated);
      }
    });
  },

  stopListening: () => {
    console.log('[ProgressEmitter] Stopping native transfer event listeners');
    if (progressSubscription) {
      progressSubscription.remove();
      progressSubscription = null;
    }
    if (successSubscription) {
      successSubscription.remove();
      successSubscription = null;
    }
    if (errorSubscription) {
      errorSubscription.remove();
      errorSubscription = null;
    }
  }
};
