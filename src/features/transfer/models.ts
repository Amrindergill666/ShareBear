export type TransferState =
  | 'REQUESTED'
  | 'WAITING_FOR_USER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mime: string;
}

export interface PeerProfile {
  deviceId: string;
  deviceName: string;
}

export interface TransferRequest {
  sender: PeerProfile;
  files: FileMetadata[];
  totalFiles: number;
  totalSize: number;
}

export interface TransferResponse {
  accepted: boolean;
  transferId?: string;
  reason?: string;
}

export interface Transfer {
  transferId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  status: TransferState;
  createdAt: number;
  totalFiles: number;
  totalBytes: number;
  files: FileMetadata[];
}
