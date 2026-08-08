import { useTransferStore } from '../../store/transferStore';

export const DownloadManager = {
  getActiveDownloads: () => {
    const session = useTransferStore.getState().activeSession;
    if (session && session.direction === 'download') {
      return [session];
    }
    return [];
  }
};
