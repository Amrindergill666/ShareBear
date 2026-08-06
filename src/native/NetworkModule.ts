import { NativeModules, NativeEventEmitter } from 'react-native';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  ipAddress: string;
  httpPort: number;
}

interface NetworkModuleInterface {
  startDiscovery(
    deviceId: string,
    deviceName: string,
    httpPort: number
  ): Promise<void>;
  stopDiscovery(): Promise<void>;
  getDiscoveredDevices(): Promise<DeviceInfo[]>;
}

const { NetworkModule } = NativeModules;

export const NativeNetworkModule = NetworkModule as NetworkModuleInterface;

export const NetworkEventEmitter = new NativeEventEmitter(NetworkModule);
