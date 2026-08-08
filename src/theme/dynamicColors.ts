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
const DEFAULT_DARK_SEMANTIC: SemanticTheme = {
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
const DEFAULT_LIGHT_SEMANTIC: SemanticTheme = {
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
  navBg: 'rgba(255, 255, 255, 0.92)',
  navActiveBg: '#FBE0A6',
  navActiveIcon: '#765B27',
  navInactiveIcon: '#64748B',
  success: '#059669',
  error: '#E11D48',
  warning: '#D97706',
  info: '#2563EB',
};

/**
 * Builds a full SemanticTheme from raw dynamic colors or defaults
 */
export function buildThemeFromNative(raw: any): DynamicColorsResult {
  const isDark = raw?.isDarkMode ?? (Appearance.getColorScheme() !== 'light');
  const defaults = isDark ? DEFAULT_DARK_SEMANTIC : DEFAULT_LIGHT_SEMANTIC;

  if (raw && raw.isSupported && raw.semantic) {
    const sem = raw.semantic;
    const accent1 = raw.accent1;
    const accent2 = raw.accent2;
    const neutral1 = raw.neutral1;
    const neutral2 = raw.neutral2;

    const navBg = isDark
      ? `rgba(${hexToRgb(neutral2?.['800'] || sem.surface || '#122536')}, 0.90)`
      : `rgba(${hexToRgb(sem.surface || '#FFFFFF')}, 0.92)`;

    const theme: SemanticTheme = {
      primary: sem.primary || defaults.primary,
      primaryContainer: sem.primaryContainer || defaults.primaryContainer,
      onPrimary: sem.onPrimary || defaults.onPrimary,
      onPrimaryContainer: sem.onPrimaryContainer || defaults.onPrimaryContainer,
      secondary: sem.secondary || defaults.secondary,
      secondaryContainer: sem.secondaryContainer || defaults.secondaryContainer,
      onSecondary: sem.onSecondary || defaults.onSecondary,
      onSecondaryContainer: sem.onSecondaryContainer || defaults.onSecondaryContainer,
      tertiary: sem.tertiary || defaults.tertiary,
      tertiaryContainer: sem.tertiaryContainer || defaults.tertiaryContainer,
      background: sem.background || defaults.background,
      surface: sem.surface || defaults.surface,
      surfaceVariant: isDark ? (neutral2?.['700'] || sem.surfaceVariant || defaults.surfaceVariant) : (neutral2?.['100'] || sem.surfaceVariant || defaults.surfaceVariant),
      surfaceElevated: sem.surfaceElevated || defaults.surfaceElevated,
      outline: sem.outline || defaults.outline,
      outlineVariant: sem.outlineVariant || defaults.outlineVariant,
      textPrimary: sem.textPrimary || defaults.textPrimary,
      textSecondary: sem.textSecondary || defaults.textSecondary,
      textMuted: sem.textMuted || defaults.textMuted,
      // Mapped specialized tokens with distinct contrast
      accent: sem.primary || defaults.accent,
      cardBg: isDark ? (neutral1?.['800'] || sem.surface) : (neutral1?.['10'] || '#FFFFFF'),
      cardBorder: isDark ? (neutral2?.['600'] || sem.outline) : (neutral2?.['200'] || '#E2E8F0'),
      navBg: navBg,
      navActiveBg: isDark ? (accent1?.['800'] || sem.primaryContainer) : (accent1?.['100'] || sem.primaryContainer),
      navActiveIcon: isDark ? (accent1?.['200'] || sem.primary) : (accent1?.['600'] || sem.primary),
      navInactiveIcon: isDark ? (neutral2?.['300'] || defaults.navInactiveIcon) : (neutral2?.['500'] || defaults.navInactiveIcon),
      success: '#10B981',
      error: '#F43F5E',
      warning: '#F59E0B',
      info: '#3B82F6',
    };

    return {
      isSupported: true,
      isDarkMode: isDark,
      accent1: raw.accent1,
      accent2: raw.accent2,
      accent3: raw.accent3,
      neutral1: raw.neutral1,
      neutral2: raw.neutral2,
      semantic: theme,
    };
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
export function getInitialDynamicColors(): DynamicColorsResult {
  if (Platform.OS === 'android' && DynamicColorsModule?.getDynamicColorsSync) {
    try {
      const raw = DynamicColorsModule.getDynamicColorsSync();
      return buildThemeFromNative(raw);
    } catch (e) {
      console.warn('Failed to get synchronous dynamic colors:', e);
    }
  }
  return buildThemeFromNative(null);
}

/**
 * Fetch dynamic colors asynchronously from native Android
 */
export async function fetchDynamicColorsAsync(): Promise<DynamicColorsResult> {
  if (Platform.OS === 'android' && DynamicColorsModule?.getDynamicColors) {
    try {
      const raw = await DynamicColorsModule.getDynamicColors();
      return buildThemeFromNative(raw);
    } catch (e) {
      console.warn('Failed to get asynchronous dynamic colors:', e);
    }
  }
  return buildThemeFromNative(null);
}
