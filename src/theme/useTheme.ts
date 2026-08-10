import { useEffect } from 'react';
import { AppState, AppStateStatus, Appearance, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { create } from 'zustand';
import {
  DynamicColorsResult,
  SemanticTheme,
  getInitialDynamicColors,
  fetchDynamicColorsAsync,
  buildThemeFromNative,
} from './dynamicColors';
import { useSettingsStore } from '../store/settingsStore';

const { DynamicColorsModule } = NativeModules;

// Cache the raw palette from Android so theme mode switching (Light/Dark/System) is 0ms instant
let cachedRawPalette: any = null;
if (Platform.OS === 'android' && DynamicColorsModule?.getDynamicColorsSync) {
  try {
    cachedRawPalette = DynamicColorsModule.getDynamicColorsSync();
  } catch (e) {}
}

interface ThemeState {
  themeResult: DynamicColorsResult;
  colors: SemanticTheme;
  isSupported: boolean;
  isDarkMode: boolean;
  setThemeResult: (result: DynamicColorsResult) => void;
  refreshTheme: (overridePref?: 'system' | 'dark' | 'light') => Promise<void>;
  applyThemeInstant: (pref: 'system' | 'dark' | 'light') => void;
}

const initialPref = useSettingsStore.getState().theme || 'system';
const initial = cachedRawPalette
  ? buildThemeFromNative(cachedRawPalette, initialPref)
  : getInitialDynamicColors(initialPref);

export const useThemeStore = create<ThemeState>((set) => ({
  themeResult: initial,
  colors: initial.semantic,
  isSupported: initial.isSupported,
  isDarkMode: initial.isDarkMode,
  setThemeResult: (result: DynamicColorsResult) =>
    set({
      themeResult: result,
      colors: result.semantic,
      isSupported: result.isSupported,
      isDarkMode: result.isDarkMode,
    }),
  applyThemeInstant: (pref: 'system' | 'dark' | 'light') => {
    // 0ms synchronous instantaneous theme calculation
    const instant = buildThemeFromNative(cachedRawPalette, pref);
    set({
      themeResult: instant,
      colors: instant.semantic,
      isSupported: instant.isSupported,
      isDarkMode: instant.isDarkMode,
    });
  },
  refreshTheme: async (overridePref?: 'system' | 'dark' | 'light') => {
    const pref = overridePref || useSettingsStore.getState().theme || 'system';
    // 1. Instant sync update
    const instant = buildThemeFromNative(cachedRawPalette, pref);
    set({
      themeResult: instant,
      colors: instant.semantic,
      isSupported: instant.isSupported,
      isDarkMode: instant.isDarkMode,
    });

    // 2. Background async refresh if hardware colors updated
    try {
      const updated = await fetchDynamicColorsAsync(pref);
      cachedRawPalette = updated;
      set({
        themeResult: updated,
        colors: updated.semantic,
        isSupported: updated.isSupported,
        isDarkMode: updated.isDarkMode,
      });
    } catch (e) {}
  },
}));

/**
 * Hook to use dynamic theme colors anywhere in the app.
 * Automatically updates when Android dynamic accent colors, system theme, or user theme preference changes.
 */
export function useTheme() {
  const { colors, isSupported, isDarkMode, refreshTheme, applyThemeInstant, themeResult } = useThemeStore();
  const themePref = useSettingsStore((state) => state.theme);

  useEffect(() => {
    // Instant theme application on preference change
    applyThemeInstant(themePref);
  }, [themePref, applyThemeInstant]);

  useEffect(() => {
    // 1. Listen to app state changes
    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshTheme();
      }
    });

    // 2. Listen to system appearance changes (dark/light toggle)
    const appearanceSub = Appearance.addChangeListener(() => {
      refreshTheme();
    });

    // 3. Listen to Native EventEmitter if available
    let nativeSub: any = null;
    if (NativeModules.DynamicColorsModule) {
      try {
        const emitter = new NativeEventEmitter(NativeModules.DynamicColorsModule);
        nativeSub = emitter.addListener('onDynamicColorsChanged', (raw) => {
          cachedRawPalette = raw;
          const pref = useSettingsStore.getState().theme || 'system';
          const res = buildThemeFromNative(raw, pref);
          useThemeStore.getState().setThemeResult(res);
        });
      } catch (e) {}
    }

    return () => {
      appStateSub.remove();
      appearanceSub.remove();
      if (nativeSub) {
        nativeSub.remove();
      }
    };
  }, [refreshTheme]);

  return {
    colors,
    theme: colors,
    isSupported,
    isDarkMode,
    refreshTheme,
    palettes: themeResult,
  };
}
