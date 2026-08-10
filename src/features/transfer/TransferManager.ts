import { NativeNetworkModule, NetworkEventEmitter } from '../../native/NetworkModule';
import { useTransferStore } from '../../store/transferStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useDeviceStore } from '../../store/deviceStore';
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

  // 3. Start listening to file streaming progress events
  const { ProgressEmitter } = require('../../services/stream/ProgressEmitter');
  ProgressEmitter.startListening();

  // 4. Setup text payload received listener from Native module
  NetworkEventEmitter.addListener('TextTransferReceived', (event) => {
    const { transferId, text, transferType, senderIp } = event;
    console.log(`[TransferManager] TextTransferReceived for ${transferId}: ${text?.length || 0} chars`);

    // Auto-copy text
    if (text) {
      const { setSystemClipboardText } = require('../../utils/clipboard');
      setSystemClipboardText(text).catch(() => {});
    }

    const transfer = useTransferStore.getState().transfers[transferId];
    const senderName = transfer?.senderName || 'Nearby Device';

    // Pop open the ReceivedTextModal immediately on receiver screen!
    useTransferStore.getState().setReceivedTextModal({
      text: text || '',
      senderName,
      transferType: (transferType as 'text' | 'clipboard') || 'text',
    });

    useTransferStore.getState().updateTransferStatus(transferId, 'COMPLETED');
    if (transfer) {
      TransferRepository.saveTransfer({ ...transfer, status: 'COMPLETED', textPayload: text });
    }
  });

  transferSubscription = NetworkEventEmitter.addListener('TransferRequestReceived', (event) => {
    const { transferId, body } = event;
    console.log('[TransferManager] Incoming transfer request received:', transferId);

    try {
      const payload: TransferRequest = JSON.parse(body);
      const senderDeviceId = payload.sender.deviceId;
      const { favoriteDevices } = useDeviceStore.getState();
      const isFavoriteSender = !!favoriteDevices[senderDeviceId];

      // Construct Transfer record
      const newTransfer: Transfer = {
        transferId,
        senderId: payload.sender.deviceId,
        senderName: payload.sender.deviceName,
        receiverId: useSettingsStore.getState().deviceId || 'unknown',
        transferType: payload.transferType || 'file',
        status: isFavoriteSender ? 'ACCEPTED' : 'REQUESTED',
        createdAt: Date.now(),
        totalFiles: payload.totalFiles,
        totalBytes: payload.totalSize,
        files: payload.files,
      };

      // Add to store and save to MMKV
      useTransferStore.getState().addTransfer(newTransfer);
      TransferRepository.saveTransfer(newTransfer);

      // If sender is in Favorites/Trusted, AUTO-ACCEPT immediately without prompting user!
      if (isFavoriteSender) {
        console.log(`[TransferManager] Auto-accepting transfer from trusted favorite: ${payload.sender.deviceName}`);

        if (payload.transferType === 'text' || payload.transferType === 'clipboard') {
          NativeNetworkModule.respondToTransfer(transferId, true).catch((err) => {
            console.error('[TransferManager] Auto-accept text error:', err);
          });
          TransferStateMachine.transition(transferId, 'ACCEPTED');
          return;
        }

        const firstFile = payload.files[0];
        const totalSize = payload.totalSize || firstFile?.size || 0;

        useTransferStore.getState().setActiveSession({
          transferId,
          fileName: firstFile?.name || 'Incoming file',
          fileSize: totalSize,
          mimeType: firstFile?.mime || 'application/octet-stream',
          bytesTransferred: 0,
          percentage: 0,
          speed: 0,
          eta: 0,
          direction: 'download',
          status: 'transferring',
          peerName: payload.sender.deviceName || 'Trusted Device',
        });

        NativeNetworkModule.respondToTransfer(transferId, true).catch((err) => {
          console.error('[TransferManager] Auto-accept file error:', err);
        });
        TransferStateMachine.transition(transferId, 'ACCEPTED');
        return;
      }

      // Otherwise, mount the incoming transfer request popup dialog
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
    const incomingReq = useTransferStore.getState().activeIncomingRequest;
    if (!incomingReq) return;

    const { request } = incomingReq;
    const isTextOrClipboard = request.transferType === 'text' || request.transferType === 'clipboard';

    if (isTextOrClipboard) {
      // Respond 200 OK to unblock sender so sender can POST /transfer/{transferId}/text
      await NativeNetworkModule.respondToTransfer(transferId, true);
      useTransferStore.getState().setActiveIncomingRequest(null);
      TransferStateMachine.transition(transferId, 'ACCEPTED');
      return;
    }

    const firstFile = incomingReq?.request.files[0];
    const totalSize = incomingReq?.request.totalSize || firstFile?.size || 0;

    // Immediately open TransferProgressDialog on Receiver for file stream
    useTransferStore.getState().setActiveSession({
      transferId,
      fileName: firstFile?.name || 'Incoming file',
      fileSize: totalSize,
      mimeType: firstFile?.mime || 'application/octet-stream',
      bytesTransferred: 0,
      percentage: 0,
      speed: 0,
      eta: 0,
      direction: 'download',
      status: 'transferring',
      peerName: incomingReq?.request.sender.deviceName || 'Sender',
    });

    await NativeNetworkModule.respondToTransfer(transferId, true);
    useTransferStore.getState().setActiveIncomingRequest(null);
    TransferStateMachine.transition(transferId, 'ACCEPTED');
  } catch (error) {
    console.error('[TransferManager] Failed to send acceptance response:', error);
    TransferStateMachine.transition(transferId, 'FAILED');
    useTransferStore.getState().setActiveSession(null);
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
  files: FileMetadata[],
  peerName?: string
): Promise<string> => {
  const settings = useSettingsStore.getState();
  const localDeviceId = settings.deviceId || 'unknown';
  const localDeviceName = settings.deviceName || 'unknown';

  const transferId = `TR-OUT-${Date.now()}`;
  const firstFile = files[0];
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  
  const payload: TransferRequest = {
    sender: {
      deviceId: localDeviceId,
      deviceName: localDeviceName,
    },
    files,
    totalFiles: files.length,
    totalSize,
  };

  const newTransfer: Transfer = {
    transferId,
    senderId: localDeviceId,
    senderName: localDeviceName,
    receiverId: peerName || 'peer',
    status: 'REQUESTED',
    createdAt: Date.now(),
    totalFiles: payload.totalFiles,
    totalBytes: payload.totalSize,
    files: payload.files,
  };

  // Add outgoing record to local store and save to MMKV
  useTransferStore.getState().addTransfer(newTransfer);
  TransferRepository.saveTransfer(newTransfer);

  // Immediately display Transfer Sharing screen in 'waiting_for_peer' state on Sender side
  useTransferStore.getState().setActiveSession({
    transferId,
    fileName: firstFile?.name || 'Sharing file',
    fileSize: totalSize,
    mimeType: firstFile?.mime || 'application/octet-stream',
    bytesTransferred: 0,
    percentage: 0,
    speed: 0,
    eta: 0,
    direction: 'upload',
    status: 'waiting_for_peer',
    peerName: peerName || 'Nearby Device',
  });

  const effectivePort = (!peerPort || peerPort === 8888 || peerPort <= 0) ? (settings.port || 53317) : peerPort;

  try {
    const response = await sendTransferRequest(peerIp, effectivePort, payload);
    
    if (response.accepted && response.transferId) {
      const serverTransferId = response.transferId;

      // Swap the temporary transfer ID with the server-returned transferId
      const tempTransfer = useTransferStore.getState().transfers[transferId];
      if (tempTransfer) {
        const updatedTransfer: Transfer = {
          ...tempTransfer,
          transferId: serverTransferId,
          status: 'ACCEPTED',
        };
        
        TransferRepository.deleteTransfer(transferId);
        useTransferStore.getState().removeTransfer(transferId);
        
        useTransferStore.getState().addTransfer(updatedTransfer);
        TransferRepository.saveTransfer(updatedTransfer);
      }

      TransferStateMachine.transition(serverTransferId, 'ACCEPTED');

      // Update session to active transferring state
      useTransferStore.getState().setActiveSession({
        transferId: serverTransferId,
        fileName: firstFile?.name || 'File',
        fileSize: totalSize,
        mimeType: firstFile?.mime || 'application/octet-stream',
        bytesTransferred: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        direction: 'upload',
        status: 'transferring',
        peerName: peerName || 'Nearby Device',
      });

      // Start streaming upload of the file
      if (firstFile && firstFile.uri) {
        const { UploadManager } = require('../../services/stream/UploadManager');
        UploadManager.startUpload(
          serverTransferId,
          firstFile.uri,
          peerIp,
          effectivePort,
          firstFile.name,
          firstFile.size,
          firstFile.mime
        ).catch((err: any) => {
          console.error('[TransferManager] Stream upload failed:', err);
        });
      }

      return serverTransferId;
    } else {
      const reason = response.reason === 'TIMEOUT' ? 'Request timed out' : 'Declined by recipient';
      TransferStateMachine.transition(transferId, 'REJECTED');
      useTransferStore.getState().setActiveSession({
        transferId,
        fileName: firstFile?.name || 'File',
        fileSize: totalSize,
        mimeType: firstFile?.mime || 'application/octet-stream',
        bytesTransferred: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        direction: 'upload',
        status: 'failed',
        error: reason,
        peerName: peerName || 'Nearby Device',
      });
      setTimeout(() => {
        const cur = useTransferStore.getState().activeSession;
        if (cur?.transferId === transferId) {
          useTransferStore.getState().setActiveSession(null);
        }
      }, 2500);
      throw new Error(reason);
    }
  } catch (error: any) {
    console.error('[TransferManager] Outgoing transfer handshake failed:', error);
    TransferStateMachine.transition(transferId, 'FAILED');
    useTransferStore.getState().setActiveSession({
      transferId,
      fileName: firstFile?.name || 'File',
      fileSize: totalSize,
      mimeType: firstFile?.mime || 'application/octet-stream',
      bytesTransferred: 0,
      percentage: 0,
      speed: 0,
      eta: 0,
      direction: 'upload',
      status: 'failed',
      error: error.message || 'Unable to connect to recipient',
      peerName: peerName || 'Nearby Device',
    });
    setTimeout(() => {
      const cur = useTransferStore.getState().activeSession;
      if (cur?.transferId === transferId) {
        useTransferStore.getState().setActiveSession(null);
      }
    }, 2500);
    throw error;
  }
};

/**
 * Sends pure text or clipboard content directly to a peer without generating or streaming a file.
 */
export const startOutgoingTextTransfer = async (
  peerIp: string,
  peerPort: number,
  text: string,
  transferType: 'text' | 'clipboard' = 'text',
  peerName?: string
): Promise<string> => {
  const settings = useSettingsStore.getState();
  const localDeviceId = settings.deviceId || 'unknown';
  const localDeviceName = settings.deviceName || 'unknown';

  const transferId = `TR-TXT-${Date.now()}`;
  const totalSize = encodeURI(text).split(/%..|./).length - 1; // UTF-8 byte length
  const label = transferType === 'clipboard' ? 'Clipboard Text' : 'Text Message';

  const payload: TransferRequest = {
    sender: {
      deviceId: localDeviceId,
      deviceName: localDeviceName,
    },
    transferType,
    // NOTE: Privacy-first - content is NOT sent in handshake request!
    files: [],
    totalFiles: 1,
    totalSize,
  };

  const newTransfer: Transfer = {
    transferId,
    senderId: localDeviceId,
    senderName: localDeviceName,
    receiverId: peerName || 'peer',
    transferType,
    textPayload: text,
    status: 'REQUESTED',
    createdAt: Date.now(),
    totalFiles: 1,
    totalBytes: totalSize,
    files: [],
  };

  useTransferStore.getState().addTransfer(newTransfer);
  TransferRepository.saveTransfer(newTransfer);

  // Immediately display Transfer Sharing screen in 'waiting_for_peer' state on Sender side
  useTransferStore.getState().setActiveSession({
    transferId,
    fileName: label,
    fileSize: totalSize,
    mimeType: 'text/plain',
    bytesTransferred: 0,
    percentage: 0,
    speed: 0,
    eta: 0,
    direction: 'upload',
    status: 'waiting_for_peer',
    peerName: peerName || 'Nearby Device',
  });

  const effectivePort = (!peerPort || peerPort === 8888 || peerPort <= 0) ? (settings.port || 53317) : peerPort;

  try {
    const response = await sendTransferRequest(peerIp, effectivePort, payload);
    
    if (response.accepted && response.transferId) {
      const serverTransferId = response.transferId;

      // Update transfer ID to matched server session
      const tempTransfer = useTransferStore.getState().transfers[transferId];
      if (tempTransfer) {
        const updatedTransfer: Transfer = {
          ...tempTransfer,
          transferId: serverTransferId,
          status: 'ACCEPTED',
        };
        TransferRepository.deleteTransfer(transferId);
        useTransferStore.getState().removeTransfer(transferId);
        useTransferStore.getState().addTransfer(updatedTransfer);
        TransferRepository.saveTransfer(updatedTransfer);
      }

      // Now send the actual private text payload over POST /transfer/{serverTransferId}/text!
      await NativeNetworkModule.sendTextPayload(
        serverTransferId,
        peerIp,
        effectivePort,
        text,
        transferType
      );

      useTransferStore.getState().setActiveSession({
        transferId: serverTransferId,
        fileName: label,
        fileSize: totalSize,
        mimeType: 'text/plain',
        bytesTransferred: totalSize,
        percentage: 100,
        speed: 0,
        eta: 0,
        direction: 'upload',
        status: 'completed',
        peerName: peerName || 'Nearby Device',
      });

      useTransferStore.getState().updateTransferStatus(serverTransferId, 'COMPLETED');
      TransferRepository.saveTransfer({ ...newTransfer, transferId: serverTransferId, status: 'COMPLETED' });

      setTimeout(() => {
        const cur = useTransferStore.getState().activeSession;
        if (cur?.transferId === serverTransferId) {
          useTransferStore.getState().setActiveSession(null);
        }
      }, 1800);

      return serverTransferId;
    } else {
      const reason = response.reason === 'TIMEOUT' ? 'Request timed out' : 'Declined by recipient';
      TransferStateMachine.transition(transferId, 'REJECTED');
      useTransferStore.getState().setActiveSession({
        transferId,
        fileName: label,
        fileSize: totalSize,
        mimeType: 'text/plain',
        bytesTransferred: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
        direction: 'upload',
        status: 'failed',
        error: reason,
        peerName: peerName || 'Nearby Device',
      });
      setTimeout(() => {
        const cur = useTransferStore.getState().activeSession;
        if (cur?.transferId === transferId) {
          useTransferStore.getState().setActiveSession(null);
        }
      }, 2500);
      throw new Error(reason);
    }
  } catch (error: any) {
    console.error('[TransferManager] Outgoing text transfer failed:', error);
    TransferStateMachine.transition(transferId, 'FAILED');
    useTransferStore.getState().setActiveSession({
      transferId,
      fileName: label,
      fileSize: totalSize,
      mimeType: 'text/plain',
      bytesTransferred: 0,
      percentage: 0,
      speed: 0,
      eta: 0,
      direction: 'upload',
      status: 'failed',
      error: error.message || 'Unable to connect to recipient',
      peerName: peerName || 'Nearby Device',
    });
    setTimeout(() => {
      const cur = useTransferStore.getState().activeSession;
      if (cur?.transferId === transferId) {
        useTransferStore.getState().setActiveSession(null);
      }
    }, 2500);
    throw error;
  }
};
