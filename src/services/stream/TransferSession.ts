export interface TransferSession {
  transferId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  bytesTransferred: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  direction: 'upload' | 'download';
  status: 'idle' | 'waiting_for_peer' | 'transferring' | 'completed' | 'failed';
  peerName?: string;
  error?: string;
}
