import { NativeNetworkModule, NetworkEventEmitter } from '../../native/NetworkModule';
import { useDeviceStore } from '../../store/deviceStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';

let deviceFoundSubscription: any = null;
let deviceLostSubscription: any = null;

/**
 * Initializes listeners for discovery events emitted by the native network module.
 */
export const initializeDiscoveryListeners = () => {
  // Clear any existing subscriptions first
  removeDiscoveryListeners();

  deviceFoundSubscription = NetworkEventEmitter.addListener('DeviceFound', (device) => {
    console.log('[DiscoveryManager] Device found:', device);
    useDeviceStore.getState().addOrUpdateDevice({
      id: device.deviceId,
      name: device.deviceName,
      ip: device.ipAddress,
      port: device.httpPort,
      platform: device.platform,
      lastSeen: Date.now(),
      isOnline: true,
    });
  });

  deviceLostSubscription = NetworkEventEmitter.addListener('DeviceLost', (device) => {
    console.log('[DiscoveryManager] Device lost:', device);
    useDeviceStore.getState().removeDevice(device.deviceId);
  });
};

/**
 * Removes active discovery listeners.
 */
export const removeDiscoveryListeners = () => {
  if (deviceFoundSubscription) {
    deviceFoundSubscription.remove();
    deviceFoundSubscription = null;
  }
  if (deviceLostSubscription) {
    deviceLostSubscription.remove();
    deviceLostSubscription = null;
  }
};

/**
 * Starts the UDP discovery process on the local network.
 */
export const startDiscovery = async (): Promise<void> => {
  try {
    const settings = useSettingsStore.getState();
    let deviceId = settings.deviceId;

    // Generate a unique deviceId if one doesn't exist yet
    if (!deviceId) {
      deviceId = 'SB-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      settings.setDeviceId(deviceId);
    }

    const deviceName = settings.deviceName || 'ShareBear Device';
    const httpPort = settings.port || 53318;

    console.log(`[DiscoveryManager] Starting discovery for "${deviceName}" (${deviceId}) on port ${httpPort}...`);
    
    // Set up event listeners
    initializeDiscoveryListeners();

    // Start discovery in native Kotlin module
    await NativeNetworkModule.startDiscovery(deviceId, deviceName, httpPort);
    
    // Update store state
    useUiStore.getState().setDiscoveryActive(true);
  } catch (error) {
    console.error('[DiscoveryManager] Failed to start discovery:', error);
    throw error;
  }
};

/**
 * Stops the UDP discovery process on the local network.
 */
export const stopDiscovery = async (): Promise<void> => {
  try {
    console.log('[DiscoveryManager] Stopping discovery...');
    
    // Stop discovery in native Kotlin module
    await NativeNetworkModule.stopDiscovery();
    
    // Remove event listeners
    removeDiscoveryListeners();

    // Clear registry in Zustand store
    useDeviceStore.getState().clearAllDevices();

    // Update store state
    useUiStore.getState().setDiscoveryActive(false);
  } catch (error) {
    console.error('[DiscoveryManager] Failed to stop discovery:', error);
    throw error;
  }
};
