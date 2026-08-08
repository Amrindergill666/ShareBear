import { useEffect } from 'react';
import { AppState, AppStateStatus, Appearance, NativeEventEmitter, NativeModules } from 'react-native';
import { create } from 'zustand';
import {
  DynamicColorsResult,
  SemanticTheme,
  getInitialDynamicColors,
  fetchDynamicColorsAsync,
  buildThemeFromNative,
} from './dynamicColors';

interface ThemeState {
  themeResult: DynamicColorsResult;
  colors: SemanticTheme;
  isSupported: boolean;
  isDarkMode: boolean;
  setThemeResult: (result: DynamicColorsResult) => void;
  refreshTheme: () => Promise<void>;
}

const initial = getInitialDynamicColors();

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
  refreshTheme: async () => {
    const updated = await fetchDynamicColorsAsync();
    set({
      themeResult: updated,
      colors: updated.semantic,
      isSupported: updated.isSupported,
      isDarkMode: updated.isDarkMode,
    });
  },
}));

/**
 * Hook to use dynamic theme colors anywhere in the app.
 * Automatically updates when Android dynamic accent colors or system theme changes.
 */
export function useTheme() {
  const { colors, isSupported, isDarkMode, refreshTheme, themeResult } = useThemeStore();

  useEffect(() => {
    // 1. Listen to app state changes (when user returns from Android Settings / Wallpaper picker)
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
          const res = buildThemeFromNative(raw);
          useThemeStore.getState().setThemeResult(res);
        });
      } catch (e) {
        // EventEmitter not supported or module not registered
      }
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
