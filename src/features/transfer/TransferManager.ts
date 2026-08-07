import { NativeNetworkModule, NetworkEventEmitter } from '../../native/NetworkModule';
import { useTransferStore } from '../../store/transferStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Transfer, FileMetadata, TransferRequest } from './models';
import { TransferRepository } from './TransferRepository';
import { TransferStateMachine } from './TransferStateMachine';
import { sendTransferRequest } from './network/RequestApi';

let transferSubscription: any = null;

/**
 * Initializes the Transfer Manager. Loads history and registers listeners for incoming transfer handshakes.
 */
export const initializeTransferManager = () => {
  // 1. Load persisted transfer history from repository into store
  const history = TransferRepository.getHistory();
  const transfersRecord: Record<string, Transfer> = {};
  history.forEach((t) => {
    transfersRecord[t.transferId] = t;
  });
  useTransferStore.getState().setTransfers(transfersRecord);

  // 2. Setup incoming transfer request listener from Native module
  if (transferSubscription) {
    transferSubscription.remove();
  }

  transferSubscription = NetworkEventEmitter.addListener('TransferRequestReceived', (event) => {
    const { transferId, body } = event;
    console.log('[TransferManager] Incoming transfer request received:', transferId);

    try {
      const payload: TransferRequest = JSON.parse(body);

      // Construct Transfer record
      const newTransfer: Transfer = {
        transferId,
        senderId: payload.sender.deviceId,
        senderName: payload.sender.deviceName,
        receiverId: useSettingsStore.getState().deviceId || 'unknown',
        status: 'REQUESTED',
        createdAt: Date.now(),
        totalFiles: payload.totalFiles,
        totalBytes: payload.totalSize,
        files: payload.files,
      };

      // Add to store and save to MMKV
      useTransferStore.getState().addTransfer(newTransfer);
      TransferRepository.saveTransfer(newTransfer);

      // Mount the incoming transfer request popup dialog
      useTransferStore.getState().setActiveIncomingRequest({
        transferId,
        request: payload,
      });

      // Transition transfer lifecycle to WAITING_FOR_USER
      TransferStateMachine.transition(transferId, 'WAITING_FOR_USER');
    } catch (err) {
      console.error('[TransferManager] Error parsing incoming transfer request:', err);
    }
  });
};

/**
 * Accept the incoming transfer request. Releases native HTTP thread.
 */
export const acceptIncomingTransfer = async (transferId: string) => {
  console.log('[TransferManager] Accept incoming transfer:', transferId);
  try {
    await NativeNetworkModule.respondToTransfer(transferId, true);
    useTransferStore.getState().setActiveIncomingRequest(null);
    TransferStateMachine.transition(transferId, 'ACCEPTED');
  } catch (error) {
    console.error('[TransferManager] Failed to send acceptance response:', error);
    TransferStateMachine.transition(transferId, 'FAILED');
  }
};

/**
 * Reject the incoming transfer request. Releases native HTTP thread.
 */
export const rejectIncomingTransfer = async (transferId: string) => {
  console.log('[TransferManager] Reject incoming transfer:', transferId);
  try {
    await NativeNetworkModule.respondToTransfer(transferId, false);
    useTransferStore.getState().setActiveIncomingRequest(null);
    TransferStateMachine.transition(transferId, 'REJECTED');
  } catch (error) {
    console.error('[TransferManager] Failed to send rejection response:', error);
    TransferStateMachine.transition(transferId, 'FAILED');
  }
};

/**
 * Sends an outgoing transfer request handshake to a peer.
 */
export const startOutgoingTransfer = async (
  peerIp: string,
  peerPort: number,
  files: FileMetadata[]
): Promise<string> => {
  const settings = useSettingsStore.getState();
  const localDeviceId = settings.deviceId || 'unknown';
  const localDeviceName = settings.deviceName || 'unknown';

  const transferId = `TR-OUT-${Date.now()}`;
  
  const payload: TransferRequest = {
    sender: {
      deviceId: localDeviceId,
      deviceName: localDeviceName,
    },
    files,
    totalFiles: files.length,
    totalSize: files.reduce((acc, f) => acc + f.size, 0),
  };

  const newTransfer: Transfer = {
    transferId,
    senderId: localDeviceId,
    senderName: localDeviceName,
    receiverId: 'peer',
    status: 'REQUESTED',
    createdAt: Date.now(),
    totalFiles: payload.totalFiles,
    totalBytes: payload.totalSize,
    files: payload.files,
  };

  // Add outgoing record to local store and save to MMKV
  useTransferStore.getState().addTransfer(newTransfer);
  TransferRepository.saveTransfer(newTransfer);

  try {
    const response = await sendTransferRequest(peerIp, peerPort, payload);
    
    if (response.accepted && response.transferId) {
      TransferStateMachine.transition(transferId, 'ACCEPTED');
      return response.transferId;
    } else {
      TransferStateMachine.transition(transferId, 'REJECTED');
      throw new Error(response.reason || 'USER_DECLINED');
    }
  } catch (error: any) {
    console.error('[TransferManager] Outgoing transfer handshake failed:', error);
    TransferStateMachine.transition(transferId, 'FAILED');
    throw error;
  }
};
