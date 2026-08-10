import { create } from 'zustand';
import { storage } from '../storage/mmkv';

export interface Device {
  id: string;
  name: string;
  ip: string;
  port: number;
  platform: string;
  lastSeen: number;
  isOnline: boolean;
}

const FAVORITES_STORAGE_KEY = 'sharebear_favorite_devices';

const loadSavedFavorites = (): Record<string, Device> => {
  try {
    const raw = storage.getString(FAVORITES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[DeviceStore] Error reading favorite devices from MMKV:', err);
  }
  return {};
};

const saveFavoritesToStorage = (favorites: Record<string, Device>) => {
  try {
    storage.set(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch (err) {
    console.error('[DeviceStore] Error saving favorite devices to MMKV:', err);
  }
};

interface DeviceState {
  devices: Record<string, Device>;
  favoriteDevices: Record<string, Device>;
  addOrUpdateDevice: (device: Device) => void;
  removeDevice: (id: string) => void;
  clearOfflineDevices: () => void;
  clearAllDevices: () => void;
  toggleFavorite: (device: Device) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: {},
  favoriteDevices: loadSavedFavorites(),

  addOrUpdateDevice: (device) => {
    const normalizedDevice: Device = {
      ...device,
      port: (!device.port || device.port === 8888 || device.port <= 0) ? 53317 : device.port,
    };

    set((state) => {
      // Also update online/IP details in favoriteDevices if this device is favorited
      let updatedFavorites = state.favoriteDevices;
      if (state.favoriteDevices[normalizedDevice.id]) {
        updatedFavorites = {
          ...state.favoriteDevices,
          [normalizedDevice.id]: {
            ...state.favoriteDevices[normalizedDevice.id],
            ip: normalizedDevice.ip,
            port: normalizedDevice.port,
            isOnline: normalizedDevice.isOnline,
            lastSeen: normalizedDevice.lastSeen,
          },
        };
        saveFavoritesToStorage(updatedFavorites);
      }

      return {
        devices: {
          ...state.devices,
          [normalizedDevice.id]: normalizedDevice,
        },
        favoriteDevices: updatedFavorites,
      };
    });
  },

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

  clearAllDevices: () =>
    set({ devices: {} }),

  toggleFavorite: (device) => {
    const normalizedDevice: Device = {
      ...device,
      port: (!device.port || device.port === 8888 || device.port <= 0) ? 53317 : device.port,
    };

    set((state) => {
      const exists = !!state.favoriteDevices[normalizedDevice.id];
      const updated = { ...state.favoriteDevices };

      if (exists) {
        delete updated[normalizedDevice.id];
      } else {
        updated[normalizedDevice.id] = normalizedDevice;
      }

      saveFavoritesToStorage(updated);
      return { favoriteDevices: updated };
    });
  },

  removeFavorite: (id) => {
    set((state) => {
      const updated = { ...state.favoriteDevices };
      delete updated[id];
      saveFavoritesToStorage(updated);
      return { favoriteDevices: updated };
    });
  },

  isFavorite: (id) => {
    return !!get().favoriteDevices[id];
  },
}));
