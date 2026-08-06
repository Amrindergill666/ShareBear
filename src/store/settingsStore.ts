import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage';

export interface SettingsState {
  // Recommended system values (keys)
  deviceName: string;
  deviceId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  transferHistory: any[];
  recentDevices: any[];
  wifiConfig: { ssid?: string; password?: string } | null;
  publicKey: string | null;
  privateKey: string | null;
  downloadsPath: string;
  autoAccept: boolean;
  notifications: boolean;
  appVersion: string;
  
  // App system values
  port: number;

  // Actions/Setters
  setDeviceName: (name: string) => void;
  setDeviceId: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: string) => void;
  setTransferHistory: (history: any[]) => void;
  setRecentDevices: (devices: any[]) => void;
  setWifiConfig: (config: { ssid?: string; password?: string } | null) => void;
  setKeys: (publicKey: string | null, privateKey: string | null) => void;
  setDownloadsPath: (path: string) => void;
  setAutoAccept: (accept: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  setAppVersion: (version: string) => void;
  setPort: (port: number) => void;
  
  // Utility action
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  deviceName: 'ShareBear Device',
  deviceId: '',
  theme: 'system' as const,
  language: 'en',
  transferHistory: [],
  recentDevices: [],
  wifiConfig: null,
  publicKey: null,
  privateKey: null,
  downloadsPath: '',
  autoAccept: false,
  notifications: true,
  appVersion: '1.0.0',
  port: 53317,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setDeviceName: (name) => set({ deviceName: name }),
      setDeviceId: (id) => set({ deviceId: id }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (lang) => set({ language: lang }),
      setTransferHistory: (history) => set({ transferHistory: history }),
      setRecentDevices: (devices) => set({ recentDevices: devices }),
      setWifiConfig: (config) => set({ wifiConfig: config }),
      setKeys: (publicKey, privateKey) => set({ publicKey, privateKey }),
      setDownloadsPath: (path) => set({ downloadsPath: path }),
      setAutoAccept: (accept) => set({ autoAccept: accept }),
      setNotifications: (enabled) => set({ notifications: enabled }),
      setAppVersion: (version) => set({ appVersion: version }),
      setPort: (port) => set({ port }),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'sharebear-settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
