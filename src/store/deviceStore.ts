import { create } from 'zustand';

export interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
  lastSeen: number;
  isOnline: boolean;
}

interface DeviceState {
  devices: Record<string, Device>;
  addOrUpdateDevice: (device: Device) => void;
  removeDevice: (id: string) => void;
  clearOfflineDevices: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: {},
  addOrUpdateDevice: (device) =>
    set((state) => ({
      devices: {
        ...state.devices,
        [device.id]: device,
      },
    })),
  removeDevice: (id) =>
    set((state) => {
      const newDevices = { ...state.devices };
      delete newDevices[id];
      return { devices: newDevices };
    }),
  clearOfflineDevices: () =>
    set((state) => {
      const newDevices = { ...state.devices };
      Object.keys(newDevices).forEach((key) => {
        if (!newDevices[key].isOnline) {
          delete newDevices[key];
        }
      });
      return { devices: newDevices };
    }),
}));
