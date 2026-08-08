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
  respondToTransfer(
    transferId: string,
    accept: boolean
  ): Promise<boolean>;
  startUpload(
    transferId: string,
    fileUri: string,
    peerIp: string,
    peerPort: number,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<string>;
  getLocalIpAddress(): Promise<string>;
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
