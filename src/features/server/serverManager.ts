import { NativeNetworkModule, NetworkEventEmitter } from '../../native/NetworkModule';
import { useServerStore } from '../../store/serverStore';
import { useSettingsStore } from '../../store/settingsStore';

let serverStatsSubscription: any = null;

/**
 * Initializes listeners for server event updates emitted by the native HTTP module.
 */
export const initializeServerListeners = () => {
  if (serverStatsSubscription) {
    serverStatsSubscription.remove();
  }

  serverStatsSubscription = NetworkEventEmitter.addListener('ServerStatsUpdated', (stats) => {
    console.log('[ServerManager] Server stats updated:', stats);
    useServerStore.getState().setServerStats({
      isRunning: stats.isRunning,
      port: stats.port,
      requestsReceived: stats.requestsReceived,
      lastRequestIp: stats.lastRequestIp,
    });
  });
};

/**
 * Clean up server event listeners.
 */
export const removeServerListeners = () => {
  if (serverStatsSubscription) {
    serverStatsSubscription.remove();
    serverStatsSubscription = null;
  }
};

/**
 * Starts the HTTP Control Server.
 */
export const startServer = async (): Promise<void> => {
  try {
    const settings = useSettingsStore.getState();
    let deviceId = settings.deviceId;

    // Generate a unique deviceId if one doesn't exist yet
    if (!deviceId) {
      deviceId = 'SB-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      settings.setDeviceId(deviceId);
    }

    const deviceName = settings.deviceName || 'ShareBear Device';
    const port = settings.port || 53317; // HTTP Server Port defaults to 53317/53318

    console.log(`[ServerManager] Starting HTTP Server on port ${port}...`);

    // Setup listener
    initializeServerListeners();

    // Start native server
    await NativeNetworkModule.startServer(port, deviceId, deviceName);

    // Initial stats fetch
    const stats = await NativeNetworkModule.getServerStats();
    useServerStore.getState().setServerStats(stats);
  } catch (error) {
    console.error('[ServerManager] Failed to start HTTP Server:', error);
    throw error;
  }
};

/**
 * Stops the HTTP Control Server.
 */
export const stopServer = async (): Promise<void> => {
  try {
    console.log('[ServerManager] Stopping HTTP Server...');
    await NativeNetworkModule.stopServer();
    removeServerListeners();
    useServerStore.getState().reset();
  } catch (error) {
    console.error('[ServerManager] Failed to stop HTTP Server:', error);
    throw error;
  }
};

/**
 * Queries active stats and updates the store.
 */
export const updateServerStats = async (): Promise<void> => {
  try {
    const stats = await NativeNetworkModule.getServerStats();
    useServerStore.getState().setServerStats(stats);
  } catch (error) {
    console.error('[ServerManager] Failed to update server stats:', error);
  }
};
