import { storage } from './mmkv';

/**
 * Registry of recommended system storage keys
 */
export const STORAGE_KEYS = {
  DEVICE_NAME: 'device_name',
  DEVICE_ID: 'device_id',
  THEME: 'theme',
  LANGUAGE: 'language',
  TRANSFER_HISTORY: 'transfer_history',
  RECENT_DEVICES: 'recent_devices',
  WIFI_CONFIG: 'wifi_config',
  PUBLIC_KEY: 'public_key',
  PRIVATE_KEY: 'private_key',
  DOWNLOADS_PATH: 'downloads_path',
  AUTO_ACCEPT: 'auto_accept',
  NOTIFICATIONS: 'notifications',
  APP_VERSION: 'app_version',
} as const;

/**
 * Storage Helper Functions wrapping react-native-mmkv
 */
export const storageHelpers = {
  /**
   * Set a string value
   */
  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  /**
   * Get a string value
   */
  getString: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },

  /**
   * Set a number value
   */
  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  /**
   * Get a number value
   */
  getNumber: (key: string): number | null => {
    return storage.getNumber(key) ?? null;
  },

  /**
   * Set a boolean value
   */
  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  /**
   * Get a boolean value
   */
  getBoolean: (key: string): boolean | null => {
    return storage.getBoolean(key) ?? null;
  },

  /**
   * Set a serialized object/array
   */
  setObject: <T>(key: string, value: T): void => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Error setting object for key "${key}":`, error);
    }
  },

  /**
   * Get a parsed object/array
   */
  getObject: <T>(key: string): T | null => {
    try {
      const value = storage.getString(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[Storage] Error getting object for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Check if a key exists in storage
   */
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  /**
   * Delete a key from storage
   */
  delete: (key: string): void => {
    storage.remove(key);
  },

  /**
   * Clear all items in storage
   */
  clearAll: (): void => {
    storage.clearAll();
  },

  /**
   * Retrieve all keys in storage
   */
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },
};

/**
 * Custom StateStorage adapter for Zustand integration
 */
export const zustandStorage = {
  getItem: (name: string): string | null => {
    return storage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};
