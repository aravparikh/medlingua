/**
 * MedLingua design system.
 *
 * THE IDEA, IN ONE SENTENCE
 * A bilingual clinic form set in type: white paper, black ink, one blue that
 * only ever means "tap this", hairline rules instead of boxes — and one
 * enormous live line that both people can read from across the room.
 *
 * Every decision below derives from that. If something here can't be argued
 * back to "a well-run clinic's paperwork, alive", it doesn't belong.
 *
 * WHAT THIS IS NOT (each was the generic answer; each was replaced on purpose)
 *   cream paper + clay accent      → true white/black, one blue. Warm cream reads
 *                                    "wellness app"; a clinic form is white.
 *   cards with soft shadows        → hairline rules. Paper has no drop shadow.
 *   chat bubbles                   → a ledger of turns plus one live display line.
 *   "A · B" bilingual labels       → one reader-first label (see LABEL RULE).
 *   ALL-CAPS tracked eyebrows      → plain sentence-case captions.
 *   pill buttons                   → one control radius everywhere.
 *   shimmer skeletons              → a still "translating" line (see motion).
 *
 * RTL: not required — supported languages are es, zh, vi, hi, pa, ru. Adding
 * an RTL language would need I18nManager.forceRTL, start/end instead of
 * left/right in every style, and mirrored role edges. Nothing else here assumes
 * direction.
 */

import { useColorScheme, type TextStyle } from 'react-native';

/* ───────────────────────────── Colour ───────────────────────────── */

/**
 * Two schemes designed side by side, not derived from each other. Dark is true
 * black with Apple-system-grey surfaces — the honest OLED answer, and a real
 * convention rather than a tinted near-black pretending to be one. The accent
 * flips lightness per scheme so it stays a text-safe blue on both grounds;
 * in dark mode primary buttons are light blue with black type.
 *
 * Every text/ground pair below was measured (WCAG 2.x):
 *   light  ink/bg 21.0  ink2/bg 7.97  accent/bg 7.48  onAccent/accent 7.48
 *          caution/bg 6.21  caution/cautionBg 5.58  danger/bg 6.54  danger/dangerBg 5.35
 *   dark   ink/bg 21.0  ink2/bg 9.16  accent/bg 8.95  onAccent/accent 8.95
 *          caution/bg 11.25 caution/cautionBg 8.78  danger/bg 8.27  danger/dangerBg 6.95
 * Translated text is always `ink` on `bg` or `surface`: ≥17:1, AAA at any size.
 */
export interface ColorTokens {
  /** Page ground. */
  bg: string;
  /** Recessed panels: sheets, inputs, the turn ledger. */
  surface: string;
  /** Pressed state of a surface. */
  surfacePressed: string;
  /** Hairline separator. Decorative — not a control boundary. */
  rule: string;
  /** Control edges (inputs, outlined buttons): ≥3:1 against bg. */
  border: string;
  /** Primary text. */
  ink: string;
  /** Secondary text: captions, the other-language echo of a label. */
  ink2: string;
  /** The one action colour. Passes as text on bg. */
  accent: string;
  /** Text/icon on an accent fill. */
  onAccent: string;
  /** Safeguard CAUTION and mid pain. */
  caution: string;
  cautionBg: string;
  /** Safeguard BLOCK, recording, high pain. */
  danger: string;
  dangerBg: string;
  /** Scrim behind sheets. */
  overlay: string;
  /**
   * Pain intensity 0–10 as four stops: none → mild → moderate → severe.
   * Same "warmer is worse" rule as the safeguard, so one legend serves both.
   */
  pain: readonly [string, string, string, string];
}

export const lightColors: ColorTokens = {
  bg: '#FFFFFF',
  surface: '#F2F4F5',
  surfacePressed: '#E4E8EA',
  rule: '#D9DEE0',
  border: '#6B757B',
  ink: '#000000',
  ink2: '#4A5257',
  accent: '#1849C6',
  onAccent: '#FFFFFF',
  caution: '#9A4B00',
  cautionBg: '#FFF1DC',
  danger: '#B3261E',
  dangerBg: '#FFE2DF',
  overlay: 'rgba(0, 0, 0, 0.48)',
  pain: ['#4A5257', '#C77700', '#B3261E', '#7A0F0A'],
};

export const darkColors: ColorTokens = {
  bg: '#000000',
  surface: '#1C1C1E',
  surfacePressed: '#2C2C2E',
  rule: '#3A3A3C',
  border: '#8E8E93',
  ink: '#FFFFFF',
  ink2: '#A6ACB1',
  accent: '#7FA8FF',
  onAccent: '#000000',
  caution: '#F2B24C',
  cautionBg: '#2B1D06',
  danger: '#FF7A70',
  dangerBg: '#2E0F0D',
  overlay: 'rgba(0, 0, 0, 0.64)',
  pain: ['#A6ACB1', '#F2B24C', '#FF7A70', '#FF3B30'],
};

export type Scheme = 'light' | 'dark';

/** Resolves the active scheme's tokens. Components read colours here, never
 * from a static import, so dark mode is a property of the tree, not a rebuild. */
export function useTheme(): { scheme: Scheme; colors: ColorTokens } {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: scheme === 'dark' ? darkColors : lightColors };
}

/* ────────────────────────── Speaker roles ───────────────────────── */

/**
 * Two people share one screen. A turn is attributed by three cues at once, so
 * no single one carries it — never hue alone:
 *   1. edge    a 3pt solid bar on the leading edge, `ink` for the patient,
 *              `accent` for the clinician;
 *   2. script  the text is set in the speaker's own language and script;
 *   3. glyph   a role mark from components/icons (person / stethoscope).
 * The live line at the bottom of the conversation is always in the READER's
 * language — whose turn it is, is whose script is in the big type.
 */
export const roles = {
  patient: { edge: 'ink', glyph: 'person' },
  clinician: { edge: 'accent', glyph: 'stethoscope' },
} as const satisfies Record<'patient' | 'clinician', { edge: keyof ColorTokens; glyph: string }>;

export const ROLE_EDGE_WIDTH = 3;

/* ─────────────────────────── Typography ─────────────────────────── */

/**
 * One family: Noto Sans. It is the only Google family with first-party Latin,
 * Cyrillic, Vietnamese, Devanagari, Gurmukhi and Simplified Chinese cuts drawn
 * to one design, which is what "one typeface" has to mean across seven
 * languages. Three weights, no more.
 *
 * Coverage is by script, not by language:
 *   latin       en es vi ru   @expo-google-fonts/noto-sans (Cyrillic + Vietnamese included)
 *   devanagari  hi            @expo-google-fonts/noto-sans-devanagari   0.6 MB / 3 weights
 *   gurmukhi    pa            @expo-google-fonts/noto-sans-gurmukhi     0.2 MB / 3 weights
 *   han         zh            SYSTEM FONT by default — see below
 *
 * Han: Noto Sans SC is 30.2 MB for three weights, larger than the rest of the
 * app. Both platforms already ship a Noto-matched CJK face (PingFang SC on
 * iOS; Android's system CJK font IS Noto Sans CJK), so `han` maps to the
 * system font via fontWeight. To bundle it anyway, load NotoSansSC_* in
 * App.tsx and set `han` below to the family names.
 */
export type Weight = 'regular' | 'semibold' | 'bold';
type Script = 'latin' | 'devanagari' | 'gurmukhi' | 'han';

const SCRIPT_FOR_LANGUAGE: Record<string, Script> = {
  en: 'latin',
  es: 'latin',
  vi: 'latin',
  ru: 'latin',
  hi: 'devanagari',
  pa: 'gurmukhi',
  zh: 'han',
};

/** Family names as registered by expo-font in App.tsx. `null` = system font. */
const FAMILIES: Record<Script, Record<Weight, string> | null> = {
  latin: { regular: 'NotoSans_400Regular', semibold: 'NotoSans_600SemiBold', bold: 'NotoSans_700Bold' },
  devanagari: {
    regular: 'NotoSansDevanagari_400Regular',
    semibold: 'NotoSansDevanagari_600SemiBold',
    bold: 'NotoSansDevanagari_700Bold',
  },
  gurmukhi: {
    regular: 'NotoSansGurmukhi_400Regular',
    semibold: 'NotoSansGurmukhi_600SemiBold',
    bold: 'NotoSansGurmukhi_700Bold',
  },
  han: null,
};

const SYSTEM_WEIGHT: Record<Weight, NonNullable<TextStyle['fontWeight']>> = {
  regular: '400',
  semibold: '600',
  bold: '700',
};

/**
 * The font for text in a given language at a given weight. Returns a style
 * fragment rather than a family name because a bundled cut encodes weight in
 * its family name while a system font takes `fontWeight` — callers spread it
 * and never need to know which they got.
 */
export function fontFor(languageCode: string, weight: Weight = 'regular'): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  const family = FAMILIES[SCRIPT_FOR_LANGUAGE[languageCode] ?? 'latin'];
  return family ? { fontFamily: family[weight] } : { fontWeight: SYSTEM_WEIGHT[weight] };
}

/**
 * Five sizes. Body is 17 (the brief's floor); nothing is set under 15.
 * `display` is the live translation and the only size meant to be read from
 * standing height. Line heights are fixed per size so mixed-script lines
 * (Latin next to Devanagari) don't jitter.
 */
export const text = {
  caption: { fontSize: 15, lineHeight: 20 },
  body: { fontSize: 17, lineHeight: 24 },
  title: { fontSize: 22, lineHeight: 28 },
  heading: { fontSize: 28, lineHeight: 34 },
  display: { fontSize: 44, lineHeight: 50 },
} as const;

/* ─────────────────────────── Label rule ─────────────────────────── */

/**
 * THE BILINGUAL LABEL RULE — one rule, applied everywhere, replacing 32 "A · B"s.
 *
 *   1. Decide the reader first. A control only one person uses is labelled
 *      once, in that person's language. The patient's speak button is in the
 *      patient's language; the clinician's is in English; neither echoes.
 *   2. Shared chrome (Done, Cancel, close, section names) is labelled in the
 *      PATIENT's language as the primary line, with English as a second line
 *      beneath it — `body` over `caption`, `ink` over `ink2`, 4pt apart.
 *      Stacked, never inline; never joined by a separator character.
 *   3. When both languages are English, the second line is omitted.
 *
 * The patient is primary on shared chrome because the clinician can read
 * small English and the patient cannot read small anything.
 */
export interface BilingualLabel {
  primary: string;
  /** Undefined when identical to primary (English patient) or single-reader. */
  secondary?: string;
}

export function bilingual(primary: string, secondary: string): BilingualLabel {
  return primary === secondary ? { primary } : { primary, secondary };
}

/* ─────────────────────── Space, shape, motion ───────────────────── */

/** 4pt grid. (`hairline` is a transitional alias — delete with the block below.) */
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, hairline: 4 } as const;

/**
 * Two radii: controls, and the sheets that slide over the page.
 * sm/md/lg/xl/pill are transitional aliases for un-migrated files — the five-
 * step scale and the pill shape collapse onto these two. Delete in step 3.
 */
export const radius = {
  control: 12,
  sheet: 20,
  /** @deprecated */ sm: 12,
  /** @deprecated */ md: 12,
  /** @deprecated */ lg: 20,
  /** @deprecated */ xl: 20,
  /** @deprecated */ pill: 999,
} as const;

/** Tap targets: 48 is the floor; patient-facing primary actions use 64. */
export const tapTarget = { min: 48, primary: 64 } as const;

/**
 * Elevation: paper has none. The single exception is a sheet lifted over the
 * page, which needs to read as "above" — one shadow, used only there.
 */
export const elevation = {
  none: {},
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/**
 * Motion answers a tap or a state change; nothing moves on its own.
 *   tap     press feedback (scale/opacity)
 *   reveal  content appearing or a sheet arriving
 * The "translating" state is a still line with a still caption — no shimmer,
 * no pulse. Waiting should look like waiting, not like loading a feed.
 */
export const motion = {
  tap: 120,
  reveal: 200,
  /** @deprecated */ fast: 120,
  /** @deprecated */ base: 200,
  /** @deprecated ambient loop, removed in step 3 */ shimmer: 700,
  /** @deprecated ambient loop, removed in step 3 */ pulse: 1100,
} as const;

/** Icon stroke geometry (components/icons): 24-grid, round caps/joins. */
export const strokes = { icon: 2.5, iconSmall: 3 } as const;

/* ═══════════════════ TRANSITIONAL ALIASES — DELETE IN STEP 3 ═══════════════════
 * Everything below exists only so the un-migrated files still compile and
 * render while screens are redesigned one at a time. Importing any of these
 * names is a lint error (no-restricted-imports, eslint.config.js) except from
 * the files listed there — that list and this one are the same list. Cross a
 * file off both when it migrates; when both are empty, delete this block.
 *
 *   [x] App.tsx
 *   [ ] src/components/BodyMap.tsx
 *   [ ] src/components/FullscreenTranslation.tsx
 *   [x] src/components/LevelMeter.tsx
 *   [ ] src/components/RightsCard.tsx
 *   [ ] src/components/Skeleton.tsx
 *   [x] src/components/SpeakButton.tsx
 *   [ ] src/components/SummaryModal.tsx
 *   [ ] src/components/icons/scenes.tsx
 *   [ ] src/screens/AboutScreen.tsx
 *   [x] src/screens/ConversationScreen.tsx
 *   [x] src/screens/LanguageSelectScreen.tsx
 */

/** @deprecated static light tokens — use useTheme(). */
export const colors = {
  background: lightColors.bg,
  surface: lightColors.bg,
  surfaceTint: lightColors.surface,
  surfaceTintSecondary: lightColors.surface,
  text: lightColors.ink,
  textMuted: lightColors.ink2,
  textFaint: lightColors.ink2,
  primary: lightColors.accent,
  primaryPressed: '#12379A',
  onPrimary: lightColors.onAccent,
  primaryTint: lightColors.surface,
  secondary: lightColors.ink,
  secondaryPressed: '#2A2A2A',
  onSecondary: lightColors.bg,
  accent: lightColors.accent,
  border: lightColors.rule,
  borderStrong: lightColors.border,
  listening: lightColors.danger,
  listeningPressed: '#8E1B15',
  dangerBg: lightColors.dangerBg,
  dangerText: lightColors.danger,
  overlay: lightColors.overlay,
  onPrimaryTint: 'rgba(255, 255, 255, 0.18)',
} as const;

/** @deprecated raw palette — components must use semantic tokens. */
export const palette = { teal900: lightColors.ink } as const;

/** @deprecated weight-in-name families — use fontFor(). Lexend is gone. */
export const fonts = {
  display: 'NotoSans_700Bold',
  displayMedium: 'NotoSans_600SemiBold',
  body: 'NotoSans_400Regular',
  bodyMedium: 'NotoSans_600SemiBold',
  bodyBold: 'NotoSans_700Bold',
} as const;

/** @deprecated — use fontFor(code, 'semibold').fontFamily. */
export function displayFontFor(languageCode: string): string {
  return fontFor(languageCode, 'semibold').fontFamily ?? fonts.displayMedium;
}

/** @deprecated old scale — use `text`. Values snapped to the new five sizes. */
export const type = {
  micro: 15,
  caption: 15,
  small: 17,
  body: 17,
  button: 22,
  title: 28,
  translation: 44,
  hero: 44,
} as const;

/** @deprecated — use tapTarget. */
export const MIN_TARGET = tapTarget.primary;

/** @deprecated — cards have no shadow; only `elevation.sheet` remains. */
export const shadows = { card: elevation.none, raised: elevation.none, floating: elevation.sheet } as const;

