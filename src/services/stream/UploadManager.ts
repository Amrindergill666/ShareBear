import { NativeNetworkModule } from '../../native/NetworkModule';
import { useTransferStore } from '../../store/transferStore';

export const UploadManager = {
  startUpload: async (
    transferId: string,
    fileUri: string,
    peerIp: string,
    peerPort: number,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<string> => {
    console.log(`[UploadManager] Initiating upload for transfer: ${transferId} to peer: ${peerIp}:${peerPort}`);
    
    // Initialize session state in the store
    useTransferStore.getState().setActiveSession({
      transferId,
      fileName,
      fileSize,
      mimeType,
      bytesTransferred: 0,
      percentage: 0,
      speed: 0,
      eta: 0,
      direction: 'upload',
      status: 'transferring',
    });

    try {
      const response = await NativeNetworkModule.startUpload(
        transferId,
        fileUri,
        peerIp,
        peerPort,
        fileName,
        fileSize,
        mimeType
      );
      console.log(`[UploadManager] Native startUpload complete for ${transferId}:`, response);
      return response;
    } catch (error: any) {
      console.error(`[UploadManager] Native startUpload failed for ${transferId}:`, error);
      
      // Update local store state to failed
      useTransferStore.getState().setActiveSession(null);
      useTransferStore.getState().updateTransferStatus(transferId, 'FAILED');
      
      throw error;
    }
  }
};
