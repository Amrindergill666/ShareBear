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
  status: 'idle' | 'transferring' | 'completed' | 'failed';
  error?: string;
}
