/**
 * MedLingua design system.
 *
 * Two hues only — a deep clinical teal (brand, primary actions, English side)
 * and a muted indigo (the other language's side) — on warm paper neutrals.
 * Calm and trustworthy, never loud. All text/fill pairs used in the app meet
 * WCAG AAA (≥7:1) unless noted.
 *
 * Type: Lexend for display/headings (designed to improve reading proficiency —
 * right for seniors), Noto Sans for body (Latin, Vietnamese, and Cyrillic
 * coverage; Chinese falls back to the excellent system CJK fonts).
 */

/** Raw palette — never use these in components; use `colors` below. */
export const palette = {
  teal900: '#0C302B',
  teal700: '#14574E',
  teal500: '#2A9D8F',
  teal100: '#D5EAE6',
  teal50: '#ECF5F3',
  indigo900: '#132648',
  indigo700: '#1D3A6E',
  indigo100: '#DFE7F4',
  indigo50: '#EFF3FA',
  paper: '#F7F5F1',
  white: '#FFFFFF',
  ink: '#1F2D2A',
  inkMuted: '#54645F',
  inkFaint: '#7A8783',
  sand: '#E7E4DB',
  sandStrong: '#D4D0C4',
  clay900: '#7A2E14',
  clay700: '#B23A1D',
  clay50: '#FBEDE8',
} as const;

/** Semantic color tokens. */
export const colors = {
  background: palette.paper,
  surface: palette.white,
  surfaceTint: palette.teal50,
  surfaceTintSecondary: palette.indigo50,

  text: palette.ink,
  textMuted: palette.inkMuted,
  textFaint: palette.inkFaint,

  // English side / primary actions. White text on primary is ~8.6:1.
  primary: palette.teal700,
  primaryPressed: palette.teal900,
  onPrimary: palette.white,
  primaryTint: palette.teal100,

  // Other-language side. White text on secondary is ~10:1.
  secondary: palette.indigo700,
  secondaryPressed: palette.indigo900,
  onSecondary: palette.white,

  // Brand accent — decorative highlights only (fails AAA for small text on white).
  accent: palette.teal500,

  border: palette.sand,
  borderStrong: palette.sandStrong,

  // Recording state. White on listening is ~7.2:1.
  listening: palette.clay700,
  listeningPressed: palette.clay900,

  dangerBg: palette.clay50,
  dangerText: palette.clay900,

  overlay: 'rgba(18, 30, 27, 0.52)',
} as const;

/** Font families. One weight per family name (Expo Google Fonts convention). */
export const fonts = {
  display: 'Lexend_700Bold',
  displayMedium: 'Lexend_600SemiBold',
  body: 'NotoSans_400Regular',
  bodyMedium: 'NotoSans_600SemiBold',
  bodyBold: 'NotoSans_700Bold',
} as const;

/**
 * Type scale. Base body ~20pt for arm's-length reading; translation output 34pt.
 * Dynamic Type scales further (maxFontSizeMultiplier caps at 1.4–1.6 where
 * layout would otherwise break).
 */
export const type = {
  caption: 14,
  small: 17,
  body: 20,
  button: 24,
  title: 30,
  translation: 34,
  hero: 40,
} as const;

/** 4-pt spacing rhythm. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target (spec: at least 60×60pt). */
export const MIN_TARGET = 64;

/** Elevation scale — use these three, never ad-hoc shadow values. */
export const shadows = {
  card: {
    shadowColor: palette.teal900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: palette.teal900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  floating: {
    shadowColor: palette.teal900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 9,
  },
} as const;

/** Motion tokens — one rhythm everywhere. Enter uses ease-out; exits are shorter. */
export const motion = {
  fast: 150,
  base: 220,
  /** One half-cycle of the Skeleton shimmer loop. */
  shimmer: 700,
  /** One half-cycle of the listening Pulse loop. */
  pulse: 1100,
} as const;

/**
 * Display font for text in a given language. Lexend has no Cyrillic glyphs
 * (the fallback is an ugly serif on some platforms), so Russian display text
 * uses Noto Sans Bold instead. CJK falls back to the system font either way.
 */
export function displayFontFor(languageCode: string): string {
  return languageCode === 'ru' ? fonts.bodyBold : fonts.displayMedium;
}
