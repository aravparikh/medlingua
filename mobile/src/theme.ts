/**
 * MedLingua design system.
 *
 * Two hues only — a deep clinical teal (brand, primary actions, English side)
 * and a muted plum (the other language's side) — on warm paper neutrals.
 * Plum rather than a second blue: the two sides must be separable at a
 * glance, and green-vs-blue at the same value read as one dark mass.
 * Calm and trustworthy, never loud. Every text/fill pair in the app meets
 * WCAG AA (≥4.5:1 normal, ≥3:1 large); primary text pairs reach AAA. Measured:
 * ink/paper ≈13.2:1, inkMuted/paper ≈5.7:1, inkFaint/paper ≈5.1:1,
 * white/primary ≈8.4:1, white/secondary ≈9.5:1, white/listening ≈6:1,
 * secondary/surfaceTintSecondary ≈8.4:1, accent (decorative only) ≈3.1:1.
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
  plum900: '#3D2741',
  plum700: '#5A3A5E',
  plum100: '#E8DEE9',
  plum50: '#F4EFF4',
  paper: '#F7F5F1',
  white: '#FFFFFF',
  ink: '#1F2D2A',
  inkMuted: '#54645F',
  inkFaint: '#5C6B66',
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
  surfaceTintSecondary: palette.plum50,

  text: palette.ink,
  textMuted: palette.inkMuted,
  textFaint: palette.inkFaint,

  // English side / primary actions. White text on primary is ~8.6:1.
  primary: palette.teal700,
  primaryPressed: palette.teal900,
  onPrimary: palette.white,
  primaryTint: palette.teal100,

  // Other-language side. White text on secondary is ~9.5:1.
  secondary: palette.plum700,
  secondaryPressed: palette.plum900,
  onSecondary: palette.white,

  // Brand accent — decorative highlights only (fails AAA for small text on white).
  accent: palette.teal500,

  border: palette.sand,
  borderStrong: palette.sandStrong,

  // Recording state. White on listening is ~6:1 — AA at every size used.
  listening: palette.clay700,
  listeningPressed: palette.clay900,

  dangerBg: palette.clay50,
  dangerText: palette.clay900,

  overlay: 'rgba(18, 30, 27, 0.52)',
  /** Translucent white fill for icon circles/badges sitting on a brand color. */
  onPrimaryTint: 'rgba(255, 255, 255, 0.18)',
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
 * Dynamic Type scales everything up to 200% (WCAG 1.4.4); layouts use
 * minHeights and wrapping so they grow instead of clipping.
 */
export const type = {
  /** Secondary-of-secondary only (the small English line under a bilingual
   * label) — never for standalone content. */
  micro: 12,
  caption: 14,
  small: 17,
  body: 20,
  button: 24,
  title: 30,
  translation: 34,
  hero: 40,
} as const;

/** 4-pt spacing rhythm. `hairline` is the one sub-grid value: the optical
 * gap between a bilingual label and its small English echo. */
export const spacing = {
  hairline: 2,
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

/**
 * Icon stroke geometry — one drawing language for every glyph (see
 * components/icons): 24×24 grid, 2px optical margin, round caps/joins.
 * `iconSmall` keeps visual weight when a glyph renders at ≤16px.
 */
export const strokes = {
  icon: 2.5,
  iconSmall: 3,
} as const;

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
