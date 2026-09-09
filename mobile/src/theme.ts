/**
 * MedLingua design system — "sage".
 *
 * A sage-green crown melting into cream, white cards lifted 0/2/10, one green
 * for links and badges, ink-green for text and dark buttons. Display type is
 * Newsreader (400/500 + italic); everything else is Figtree (400/500/600).
 */

import { Platform, useColorScheme, type TextStyle } from 'react-native';

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
   * Editorial layer. Rules do the structural work here instead of cards, so
   * `hairline` is heavier than `rule` — it is a drawn line, not a separator
   * you are meant to look past.
   */
  hairline: string;
  /** The one solid bar in the app: the primary action. */
  ctaFill: string;
  /** Crisp warm white on the CTA. Never beige on dark. */
  onCta: string;
  /** Summary ledger ground: lighter than every other screen in light mode. */
  summaryBg: string;
  /**
   * Sage system. Secondary text and labels; tertiary English subtitles; the
   * link green; blob/selected-border mint; badge fills; the cream ground; and
   * paper white for cards. The destructive trio serves the delete rows.
   */
  inkSoft: string;
  muted: string;
  /**
   * Accent for TEXT. The fill accent measures 3.69:1 on the top of the ground
   * gradient, which fails AA at body size, so links and badge labels use this
   * and `accent` is reserved for fills, borders and icon shapes.
   */
  accentText: string;
  mint: string;
  mintLight: string;
  /** Pale top-right blob on the transcript ground. */
  blobPale: string;
  /** Bottom-sheet grabber. */
  grabber: string;
  cream: string;
  white: string;
  dangerBorder: string;
  /**
   * Pain intensity 0–10 as four stops: none → mild → moderate → severe.
   * Same "warmer is worse" rule as the safeguard, so one legend serves both.
   */
  pain: readonly [string, string, string, string];
}

export const lightColors: ColorTokens = {
  bg: '#F7F3EA',
  surface: '#FFFFFF',
  surfacePressed: '#EFF3EC',
  rule: 'rgba(31,42,36,0.10)',
  border: 'rgba(31,42,36,0.16)',
  ink: '#1F2A24',
  ink2: '#43524A',
  inkSoft: '#43524A',
  muted: '#556069',
  accent: '#3F7A55',
  accentText: '#376B4A',
  mint: '#A9C9B0',
  mintLight: '#E6EFE4',
  blobPale: '#CFE0D2',
  grabber: '#CFD6CF',
  cream: '#F7F3EA',
  white: '#FFFFFF',
  onAccent: '#FFFFFF',
  caution: '#8A4B12',
  cautionBg: '#F6E6D5',
  danger: '#9E3526',
  dangerBg: '#FBEEEA',
  dangerBorder: '#E6C9C0',
  overlay: 'rgba(31,42,36,0.45)',
  hairline: 'rgba(31,42,36,0.18)',
  ctaFill: '#1F2A24',
  onCta: '#FFFFFF',
  summaryBg: '#FDFCFA',
  pain: ['#635E56', '#A8701E', '#8C2F1C', '#5E1A0C'],
};

export const darkColors: ColorTokens = {
  // Dark sage: the spec ships light only, so this mirrors its roles —
  // deep green-black ground, paper-white ink, mint kept for structure.
  bg: '#141B17',
  surface: '#1E2721',
  surfacePressed: '#2A362E',
  rule: 'rgba(230, 239, 228, 0.12)',
  border: 'rgba(230, 239, 228, 0.22)',
  ink: '#EFF4EE',
  ink2: '#B9C6BB',
  inkSoft: '#B9C6BB',
  muted: '#8E9AA0',
  accent: '#A9C9B0',
  accentText: '#A9C9B0',
  mint: '#3F7A55',
  mintLight: '#2A3A2F',
  blobPale: '#24352B',
  grabber: '#3A443D',
  cream: '#141B17',
  white: '#1E2721',
  onAccent: '#141B17',
  caution: '#E8B57A',
  cautionBg: '#2E2113',
  danger: '#F0A08C',
  dangerBg: '#2E1712',
  dangerBorder: '#5A322A',
  overlay: 'rgba(0, 0, 0, 0.62)',
  hairline: 'rgba(230, 239, 228, 0.20)',
  ctaFill: '#EFF4EE',
  onCta: '#141B17',
  summaryBg: '#181F1B',
  pain: ['#A8A29A', '#E8B57A', '#F0A08C', '#FF7A63'],
};

/**
 * The speaking bloom — the light that rises while the app is listening or
 * talking. Decorative only: it never carries text, which is what lets it be
 * this saturated without a contrast problem.
 *
 * Drawn from the mark's own blues rather than a warm hue, so the one colour
 * that moves belongs to the same family as the one colour that fills. Dimmer
 * in dark mode so the ink above it keeps its contrast against the ground.
 */
export const bloom = {
  light: { inner: '#6E97A3', outer: '#A9C3CB', control: '#DCE8EB', end: '#1B2A31', peak: 1 },
  dark: { inner: '#41666F', outer: '#2B4A54', control: '#22343A', end: '#A9C3CB', peak: 0.62 },
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

export const ROLE_EDGE_WIDTH = 2;

/* ─────────────────────────── Typography ─────────────────────────── */

/**
 * UI type: Figtree for Latin and Cyrillic (Vietnamese included), drawn to one
 * design with Newsreader. Other scripts keep their Noto Sans cuts; Han uses
 * the system font. Three weights, no 700 anywhere.
 *
 * Coverage is by script, not by language:
 *   latin       en es vi   Figtree
 *   cyrillic    ru         Figtree
 *   devanagari  hi         @expo-google-fonts/noto-sans-devanagari
 *   gurmukhi    pa         @expo-google-fonts/noto-sans-gurmukhi
 *   han         zh         SYSTEM FONT by default — see below
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
 * DISPLAY is Newsreader, used for the app name, native-language names,
 * action titles and the hero headline — always 400 or 500, never bolder.
 * Newsreader is Latin-only, so every other script keeps the serif drawn for
 * it (same arrangement as before, one weight each).
 *
 * UI is Figtree 400/500/600 for everything else. `bold` resolves to 600 —
 * nothing in Sage sets 700.
 */
type DisplayCut = 'regular' | 'medium' | 'italic';

const DISPLAY_FAMILIES: Record<Script, Record<DisplayCut, string | null>> = {
  latin: {
    regular: 'Newsreader_400Regular',
    medium: 'Newsreader_500Medium',
    italic: 'Newsreader_400Regular_Italic',
  },
  cyrillic: {
    regular: 'NotoSerif_400Regular',
    medium: 'NotoSerif_400Regular',
    italic: 'NotoSerif_400Regular',
  },
  devanagari: {
    regular: 'NotoSerifDevanagari_400Regular',
    medium: 'NotoSerifDevanagari_400Regular',
    italic: 'NotoSerifDevanagari_400Regular',
  },
  gurmukhi: {
    regular: 'NotoSerifGurmukhi_400Regular',
    medium: 'NotoSerifGurmukhi_400Regular',
    italic: 'NotoSerifGurmukhi_400Regular',
  },
  han: { regular: null, medium: null, italic: null },
};

const UI_FAMILIES: Record<Script, Record<Weight, string> | null> = {
  latin: { regular: 'Figtree_400Regular', semibold: 'Figtree_600SemiBold', bold: 'Figtree_600SemiBold' },
  // Figtree covers Cyrillic and Vietnamese, so Russian keeps the UI face.
  cyrillic: { regular: 'Figtree_400Regular', semibold: 'Figtree_600SemiBold', bold: 'Figtree_600SemiBold' },
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
 * Display face for a language — app name, native names, titles, hero.
 * `medium` is Newsreader 500, `italic` the italic cut; both fall back to the
 * script's regular serif (or the system font for Han) where unavailable.
 */
export function serifFor(
  languageCode: string,
  cut: DisplayCut = 'regular',
): Pick<TextStyle, 'fontFamily' | 'fontWeight' | 'fontStyle'> {
  const family = DISPLAY_FAMILIES[scriptOf(languageCode)][cut];
  if (family) return { fontFamily: family };
  if (cut === 'italic') return { fontStyle: 'italic', fontWeight: '400' };
  return { fontWeight: cut === 'medium' ? '500' : '400' };
}

/**
 * Type scale. Reference paper scale: nothing exceeds 18, nothing below 8.5.
 * Uppercase lives in the string itself, never in textTransform, so screen
 * readers read words rather than letters.
 */
export const text = {
  label: { fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 },
  caption: { fontSize: 12.5, lineHeight: 18 },
  body: { fontSize: 13, lineHeight: 19 },
  title: { fontSize: 18, lineHeight: 24 },
  heading: { fontSize: 18, lineHeight: 24 },
  focal: { fontSize: 18, lineHeight: 24 },
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

/* ─────────────────────── Sage backgrounds ───────────────────── */

/**
 * Gradient grounds for the Sage system, rendered by SageBackground with
 * expo-linear-gradient. Stops taken straight from the spec; the 160°
 * selected gradient is approximated with start/end points.
 */
export const gradients = {
  /** Home, language selector, conversation: mint crown melting into cream. */
  ground: {
    colors: ['#CFE0D2', '#E6EFE4', '#F7F3EA'] as const,
    locations: [0, 0.45, 1] as const,
  },
  /** Selected cards and the primary speak card. */
  selected: {
    colors: ['#B7D6BF', '#DCEBDF', '#FBF8EF'] as const,
    locations: [0, 0.6, 1] as const,
    start: { x: 0.3, y: 0 } as const,
    end: { x: 0.7, y: 1 } as const,
  },
  /** Listening: cream crown, mint gathering at the bottom near controls. */
  listening: {
    colors: ['#F7F3EA', '#E6EFE4', '#B7D6BF'] as const,
    locations: [0, 0.55, 1] as const,
  },
  /** Transcription: pale, mostly cream. */
  transcript: {
    colors: ['#E6EFE4', '#F7F3EA', '#F7F3EA'] as const,
    locations: [0, 0.4, 1] as const,
  },
} as const;

/* ─────────────────────── Space, shape, motion ───────────────────── */

/** 4pt grid. */
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** Three shapes, and nothing between them. */
export const radius = {
  /** Every button, chip and pill. */
  pill: 999,
  /** Compact tiles and destructive rows. */
  tile: 20,
  /** Cards, list rows, action rows, panels and text fields — one value, so
   * nested surfaces stay concentric instead of drifting by two points. */
  card: 24,
  /** Sheets that slide over the page. */
  sheet: 28,
  /** @deprecated use `card`. */ row: 24,
  /** @deprecated use `card`. */ action: 24,
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
  /** Sage cards: white fill lifted 0/2/10 at 6% ink. */
  card: {
    shadowColor: '#1F2A24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
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
 * Motion answers a tap or a state change; nothing moves to fill time.
 *   tap     press feedback (scale/opacity)
 *   reveal  content appearing or a sheet arriving
 *   pulse   the one loop — see below
 *
 * The "translating" state is a still line with a still caption, and the
 * skeleton bars do not shimmer: waiting should look like waiting, not like
 * loading a feed.
 */
export const motion = {
  tap: 120,
  reveal: 200,
  /**
   * The single permitted loop. It runs only while something is genuinely live
   * — the app speaking (SpeakingArc), a body region held selected (Pulse) —
   * and stops the instant that state ends. It is a state indicator that
   * happens to repeat, not decoration.
   */
  pulse: 1100,
} as const;

/**
 * Row numerals in the action index. The system monospace, so no extra font
 * download for eight glyphs.
 */
export const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** Icon stroke geometry (components/icons): 16px stroked mic, 12px chevrons, all 1.6. */
export const strokes = { icon: 1.6, iconSmall: 1.6 } as const;

