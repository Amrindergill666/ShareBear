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
  startServer(
    port: number,
    deviceId: string,
    deviceName: string
  ): Promise<void>;
  stopServer(): Promise<void>;
  getServerStats(): Promise<{
    isRunning: boolean;
    port: number;
    requestsReceived: number;
    lastRequestIp: string;
    uptime: number;
  }>;
}

const { NetworkModule } = NativeModules;

export const NativeNetworkModule = NetworkModule as NetworkModuleInterface;

export const NetworkEventEmitter = new NativeEventEmitter(NetworkModule);
