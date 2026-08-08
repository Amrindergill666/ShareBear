export const StreamController = {
  cancelTransfer: async (transferId: string): Promise<void> => {
    console.log(`[StreamController] Cancelling transfer: ${transferId}`);
    // Update transfer state to failed if needed
  }
};
