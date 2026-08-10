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
  uri?: string;
}

export interface PeerProfile {
  deviceId: string;
  deviceName: string;
}

export type TransferType = 'file' | 'text' | 'clipboard';

export interface TransferRequest {
  sender: PeerProfile;
  transferType?: TransferType;
  textPayload?: string;
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
  transferType?: TransferType;
  textPayload?: string;
  status: TransferState;
  createdAt: number;
  totalFiles: number;
  totalBytes: number;
  files: FileMetadata[];
}
