/**
 * MedLingua design system — "warm paper".
 *
 * THE IDEA, IN ONE SENTENCE
 * A sheet of warm paper with one focal thing on it: the sentence, set large in
 * a serif, in the reader's own script — everything else quiet, pill-shaped and
 * out of the way, and a warm light that rises from the bottom of the screen
 * whenever the app is listening or speaking.
 *
 * Ground is bone, not white; ink is warm near-black, not black. One accent, a
 * dusty blue, and it only ever fills — never sets type, because at 1.57:1 on
 * this ground it could not. The single warm hue in the app is the speaking
 * bloom, which is decorative and carries no text.
 *
 * Restraint is the rule: one focal element per screen, and never more than one
 * accent-filled element visible at a time.
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
  bg: '#EFECE5',
  surface: '#F7F5F0',
  surfacePressed: '#E5E1D8',
  rule: 'rgba(29, 28, 26, 0.10)',
  border: 'rgba(29, 28, 26, 0.22)',
  ink: '#1D1C1A',
  // Not the mockup's #77726A: that is 4.05:1 on this ground, which is AA for
  // large text only. Darkened until secondary text passes AA at body size.
  ink2: '#635E56',
  accent: '#A9C3CB',
  onAccent: '#152227',
  caution: '#8A4B12',
  cautionBg: '#F6E6D5',
  danger: '#8C2F1C',
  dangerBg: '#F4DFD8',
  overlay: 'rgba(29, 28, 26, 0.42)',
  pain: ['#635E56', '#A8701E', '#8C2F1C', '#5E1A0C'],
};

export const darkColors: ColorTokens = {
  // Lamp-lit paper rather than an inversion: the warmth stays, the light goes.
  bg: '#17150F',
  surface: '#211E18',
  surfacePressed: '#2C2820',
  rule: 'rgba(242, 239, 232, 0.12)',
  border: 'rgba(242, 239, 232, 0.28)',
  ink: '#F2EFE8',
  ink2: '#A8A29A',
  accent: '#A9C3CB',
  onAccent: '#152227',
  caution: '#E8B57A',
  cautionBg: '#2E2113',
  danger: '#F0A08C',
  dangerBg: '#2E1712',
  overlay: 'rgba(0, 0, 0, 0.62)',
  pain: ['#A8A29A', '#E8B57A', '#F0A08C', '#FF7A63'],
};

/**
 * The speaking bloom — the warm light that rises while the app is listening or
 * talking. Decorative only: it never carries text, which is why it is allowed
 * to be the one warm hue in an otherwise cool palette. Dimmer in dark mode so
 * the ink above it keeps its contrast against the ground.
 */
export const bloom = {
  light: { inner: '#E8A288', outer: '#F2C4AD', control: '#FBE4D8', end: '#3A2019', peak: 0.95 },
  dark: { inner: '#B4674A', outer: '#7A4230', control: '#3A2019', end: '#F2C4AD', peak: 0.55 },
} as const;

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
type Script = 'latin' | 'cyrillic' | 'devanagari' | 'gurmukhi' | 'han';

const SCRIPT_FOR_LANGUAGE: Record<string, Script> = {
  en: 'latin',
  es: 'latin',
  vi: 'latin',
  ru: 'cyrillic',
  hi: 'devanagari',
  pa: 'gurmukhi',
  zh: 'han',
};

/**
 * Two families, one voice.
 *
 * DISPLAY is a serif, used only for focal text: the live translation, screen
 * titles, a language's own name. UI is Manrope, for everything else.
 *
 * Instrument Serif is the display face — but it is Latin-only, so it cannot
 * set four of the six patient languages. Each script therefore gets the serif
 * drawn for it, which is the closest thing to "one serif" that actually exists
 * across these writing systems:
 *
 *   latin       en es vi   Instrument Serif       the reference face
 *   cyrillic    ru         Noto Serif             Instrument Serif has no Cyrillic
 *   devanagari  hi         Noto Serif Devanagari
 *   gurmukhi    pa         Noto Serif Gurmukhi
 *   han         zh         system serif           Noto Serif CJK costs ~30MB
 *
 * A patient never sees two of these at once — their language sets the whole
 * screen — so the differences between them are invisible in use. `null` means
 * the system font, selected by weight.
 */
const DISPLAY_FAMILIES: Record<Script, string | null> = {
  latin: 'InstrumentSerif_400Regular',
  cyrillic: 'NotoSerif_400Regular',
  devanagari: 'NotoSerifDevanagari_400Regular',
  gurmukhi: 'NotoSerifGurmukhi_400Regular',
  han: null,
};

const UI_FAMILIES: Record<Script, Record<Weight, string> | null> = {
  latin: { regular: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold' },
  // Manrope covers Cyrillic, so Russian keeps the reference UI face.
  cyrillic: { regular: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold' },
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
  regular: '500',
  semibold: '600',
  bold: '700',
};

function scriptOf(languageCode: string): Script {
  return SCRIPT_FOR_LANGUAGE[languageCode] ?? 'latin';
}

/** UI face for a language: labels, buttons, body copy. */
export function fontFor(languageCode: string, weight: Weight = 'regular'): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  const family = UI_FAMILIES[scriptOf(languageCode)];
  return family ? { fontFamily: family[weight] } : { fontWeight: SYSTEM_WEIGHT[weight] };
}

/**
 * Display face for a language — focal text only. These serifs ship one weight
 * by design: emphasis comes from size, never from a bolder cut.
 */
export function serifFor(languageCode: string): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  const family = DISPLAY_FAMILIES[scriptOf(languageCode)];
  return family ? { fontFamily: family } : { fontWeight: '400' };
}

/**
 * Type scale. `focal` is the live translation and the one size meant to be
 * read across a room. `label` is the uppercase micro-label — the only text
 * allowed under 15pt, and never used for content a patient has to read.
 */
export const text = {
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: 'uppercase' as const },
  caption: { fontSize: 15, lineHeight: 21 },
  body: { fontSize: 17, lineHeight: 25 },
  title: { fontSize: 22, lineHeight: 29 },
  heading: { fontSize: 26, lineHeight: 32 },
  focal: { fontSize: 34, lineHeight: 41 },
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
  /** Every button and chip. The mockup's 99px, which is any large number. */
  pill: 999,
  /** Cards, panels, and text fields. */
  card: 18,
  /** Sheets that slide over the page. */
  sheet: 22,
  /** @deprecated transitional aliases — see the fence below. */
  control: 999,
  /** @deprecated */ sm: 18,
  /** @deprecated */ md: 18,
  /** @deprecated */ lg: 22,
  /** @deprecated */ xl: 22,
} as const;

/** Ghost buttons: a hairline circle with a translucent fill, no shadow. */
export const ghost = { size: 44, small: 38 } as const;

/** Tap targets: 48 is the floor; patient-facing primary actions use 64. */
export const tapTarget = { min: 48, primary: 64 } as const;

/**
 * Elevation: paper has none. The single exception is a sheet lifted over the
 * page, which needs to read as "above" — one shadow, used only there.
 */
export const elevation = {
  none: {},
  /** The one drop shadow: the primary call to action, and nothing else. */
  cta: {
    shadowColor: '#1D1C1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  /** A sheet lifted over the page reads as "above" without a visible edge. */
  sheet: {
    shadowColor: '#1D1C1A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
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
 *   [x] src/components/BodyMap.tsx
 *   [ ] src/components/FullscreenTranslation.tsx
 *   [x] src/components/LevelMeter.tsx
 *   [ ] src/components/RightsCard.tsx
 *   [ ] src/components/Skeleton.tsx
 *   [x] src/components/SpeakButton.tsx
 *   [x] src/components/SummaryModal.tsx
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

