import { NativeModules, Platform, Appearance } from 'react-native';

const { DynamicColorsModule } = NativeModules;

export type TonalPalette = {
  '0': string;
  '10': string;
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
  '1000': string;
};

export type SemanticTheme = {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;
  outline: string;
  outlineVariant: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Specialized tokens for ShareBear UI
  accent: string;
  cardBg: string;
  cardBorder: string;
  navBg: string;
  navActiveBg: string;
  navActiveIcon: string;
  navInactiveIcon: string;
  success: string;
  error: string;
  warning: string;
  info: string;
};

export type DynamicColorsResult = {
  isSupported: boolean;
  isDarkMode: boolean;
  accent1?: TonalPalette;
  accent2?: TonalPalette;
  accent3?: TonalPalette;
  neutral1?: TonalPalette;
  neutral2?: TonalPalette;
  semantic: SemanticTheme;
};

// Fallback high-fidelity dark theme palette
export const DEFAULT_DARK_SEMANTIC: SemanticTheme = {
  primary: '#CBB692',
  primaryContainer: '#56472B',
  onPrimary: '#1E1705',
  onPrimaryContainer: '#F3E5C8',
  secondary: '#57B5B6',
  secondaryContainer: '#0F2938',
  onSecondary: '#042526',
  onSecondaryContainer: '#D1F4F4',
  tertiary: '#FBBF24',
  tertiaryContainer: '#451A03',
  background: '#051521',
  surface: '#0B1D2C',
  surfaceVariant: '#172E42',
  surfaceElevated: '#1E3A52',
  outline: '#2D475D',
  outlineVariant: '#1E3345',
  textPrimary: '#F8FAFC',
  textSecondary: '#BEC8C9',
  textMuted: '#64748B',
  accent: '#CBB692',
  cardBg: '#0B1D2C',
  cardBorder: '#1E3547',
  navBg: 'rgba(18, 33, 46, 0.90)',
  navActiveBg: '#56472B',
  navActiveIcon: '#CBB692',
  navInactiveIcon: '#BEC8C9',
  success: '#10B981',
  error: '#F43F5E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// Fallback light theme palette
export const DEFAULT_LIGHT_SEMANTIC: SemanticTheme = {
  primary: '#765B27',
  primaryContainer: '#FBE0A6',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#261900',
  secondary: '#00696B',
  secondaryContainer: '#9AF0F2',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#002021',
  tertiary: '#795900',
  tertiaryContainer: '#FFDF9E',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#E2E8F0',
  surfaceElevated: '#F1F5F9',
  outline: '#CBD5E1',
  outlineVariant: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  accent: '#765B27',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  navBg: 'rgba(255, 255, 255, 0.94)',
  navActiveBg: '#FBE0A6',
  navActiveIcon: '#765B27',
  navInactiveIcon: '#64748B',
  success: '#059669',
  error: '#E11D48',
  warning: '#D97706',
  info: '#2563EB',
};

/**
 * Builds a full SemanticTheme from raw dynamic colors or defaults, respecting user theme preference
 */
export function buildThemeFromNative(
  raw: any,
  themePref: 'system' | 'dark' | 'light' = 'system'
): DynamicColorsResult {
  let isDark = true;
  if (themePref === 'dark') {
    isDark = true;
  } else if (themePref === 'light') {
    isDark = false;
  } else {
    isDark = raw?.isDarkMode ?? (Appearance.getColorScheme() !== 'light');
  }

  const defaults = isDark ? DEFAULT_DARK_SEMANTIC : DEFAULT_LIGHT_SEMANTIC;

  if (raw && raw.isSupported) {
    const accent1 = raw.accent1;
    const accent2 = raw.accent2;
    const neutral1 = raw.neutral1;
    const neutral2 = raw.neutral2;

    if (!isDark) {
      // LIGHT THEME Dynamic Material Palette
      const lightTheme: SemanticTheme = {
        primary: accent1?.['600'] || defaults.primary,
        primaryContainer: accent1?.['100'] || defaults.primaryContainer,
        onPrimary: '#FFFFFF',
        onPrimaryContainer: accent1?.['900'] || defaults.onPrimaryContainer,
        secondary: accent2?.['600'] || defaults.secondary,
        secondaryContainer: accent2?.['100'] || defaults.secondaryContainer,
        onSecondary: '#FFFFFF',
        onSecondaryContainer: accent2?.['900'] || defaults.onSecondaryContainer,
        tertiary: defaults.tertiary,
        tertiaryContainer: defaults.tertiaryContainer,
        background: neutral1?.['50'] || '#F8FAFC',
        surface: neutral1?.['10'] || '#FFFFFF',
        surfaceVariant: neutral2?.['100'] || '#F1F5F9',
        surfaceElevated: '#FFFFFF',
        outline: neutral2?.['200'] || '#CBD5E1',
        outlineVariant: neutral2?.['100'] || '#E2E8F0',
        textPrimary: neutral1?.['900'] || '#0F172A',
        textSecondary: neutral2?.['700'] || '#475569',
        textMuted: neutral2?.['500'] || '#94A3B8',
        accent: accent1?.['600'] || defaults.accent,
        cardBg: '#FFFFFF',
        cardBorder: neutral2?.['200'] || '#E2E8F0',
        navBg: 'rgba(255, 255, 255, 0.94)',
        navActiveBg: accent1?.['100'] || defaults.navActiveBg,
        navActiveIcon: accent1?.['700'] || defaults.navActiveIcon,
        navInactiveIcon: neutral2?.['500'] || defaults.navInactiveIcon,
        success: '#059669',
        error: '#E11D48',
        warning: '#D97706',
        info: '#2563EB',
      };

      return {
        isSupported: true,
        isDarkMode: false,
        accent1: raw.accent1,
        accent2: raw.accent2,
        accent3: raw.accent3,
        neutral1: raw.neutral1,
        neutral2: raw.neutral2,
        semantic: lightTheme,
      };
    } else {
      // DARK THEME Dynamic Material Palette
      const sem = raw.semantic || {};
      const navBg = `rgba(${hexToRgb(neutral2?.['800'] || sem.surface || '#122536')}, 0.90)`;

      const darkTheme: SemanticTheme = {
        primary: accent1?.['200'] || sem.primary || defaults.primary,
        primaryContainer: accent1?.['800'] || sem.primaryContainer || defaults.primaryContainer,
        onPrimary: sem.onPrimary || defaults.onPrimary,
        onPrimaryContainer: sem.onPrimaryContainer || defaults.onPrimaryContainer,
        secondary: accent2?.['200'] || sem.secondary || defaults.secondary,
        secondaryContainer: accent2?.['800'] || sem.secondaryContainer || defaults.secondaryContainer,
        onSecondary: sem.onSecondary || defaults.onSecondary,
        onSecondaryContainer: sem.onSecondaryContainer || defaults.onSecondaryContainer,
        tertiary: sem.tertiary || defaults.tertiary,
        tertiaryContainer: sem.tertiaryContainer || defaults.tertiaryContainer,
        background: neutral1?.['900'] || sem.background || defaults.background,
        surface: neutral1?.['800'] || sem.surface || defaults.surface,
        surfaceVariant: neutral2?.['700'] || sem.surfaceVariant || defaults.surfaceVariant,
        surfaceElevated: sem.surfaceElevated || defaults.surfaceElevated,
        outline: sem.outline || defaults.outline,
        outlineVariant: sem.outlineVariant || defaults.outlineVariant,
        textPrimary: neutral1?.['50'] || sem.textPrimary || defaults.textPrimary,
        textSecondary: neutral2?.['200'] || sem.textSecondary || defaults.textSecondary,
        textMuted: neutral2?.['400'] || sem.textMuted || defaults.textMuted,
        accent: accent1?.['200'] || sem.primary || defaults.accent,
        cardBg: neutral1?.['800'] || sem.surface || defaults.cardBg,
        cardBorder: neutral2?.['600'] || sem.outline || defaults.cardBorder,
        navBg: navBg,
        navActiveBg: accent1?.['800'] || sem.primaryContainer || defaults.navActiveBg,
        navActiveIcon: accent1?.['200'] || sem.primary || defaults.navActiveIcon,
        navInactiveIcon: neutral2?.['300'] || defaults.navInactiveIcon,
        success: '#10B981',
        error: '#F43F5E',
        warning: '#F59E0B',
        info: '#3B82F6',
      };

      return {
        isSupported: true,
        isDarkMode: true,
        accent1: raw.accent1,
        accent2: raw.accent2,
        accent3: raw.accent3,
        neutral1: raw.neutral1,
        neutral2: raw.neutral2,
        semantic: darkTheme,
      };
    }
  }

  return {
    isSupported: false,
    isDarkMode: isDark,
    semantic: defaults,
  };
}

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

/**
 * Fetch dynamic colors synchronously if supported, or fall back to default
 */
export function getInitialDynamicColors(themePref: 'system' | 'dark' | 'light' = 'system'): DynamicColorsResult {
  if (Platform.OS === 'android' && DynamicColorsModule?.getDynamicColorsSync) {
    try {
      const raw = DynamicColorsModule.getDynamicColorsSync();
      return buildThemeFromNative(raw, themePref);
    } catch (e) {
      console.warn('Failed to get synchronous dynamic colors:', e);
    }
  }
  return buildThemeFromNative(null, themePref);
}

/**
 * Fetch dynamic colors asynchronously from native Android
 */
export async function fetchDynamicColorsAsync(
  themePref: 'system' | 'dark' | 'light' = 'system'
): Promise<DynamicColorsResult> {
  if (Platform.OS === 'android' && DynamicColorsModule?.getDynamicColors) {
    try {
      const raw = await DynamicColorsModule.getDynamicColors();
      return buildThemeFromNative(raw, themePref);
    } catch (e) {
      console.warn('Failed to get asynchronous dynamic colors:', e);
    }
  }
  return buildThemeFromNative(null, themePref);
}
