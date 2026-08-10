import { TransferRequest, TransferResponse } from '../models';

/**
 * Sends a POST /transfer/request handshake request to a peer's HTTP control server.
 */
export const sendTransferRequest = async (
  peerIp: string,
  peerPort: number,
  payload: TransferRequest
): Promise<TransferResponse> => {
  const controller = new AbortController();
  // We use 65 seconds timeout to accommodate the receiver's 60s user-input hold block.
  const timeoutId = setTimeout(() => controller.abort(), 65000);

  try {
    const url = `http://${peerIp}:${peerPort}/transfer/request`;
    console.log(`[RequestApi] Sending POST transfer request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('[RequestApi] sendTransferRequest failed:', error);
    throw error;
  }
};
