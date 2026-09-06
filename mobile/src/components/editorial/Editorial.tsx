import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import {
  fontFor,
  mono,
  serifFor,
  spacing,
  tapTarget,
  text,
  useTheme,
  type ColorTokens,
} from '../../theme';
import { ChevronForwardIcon, MicIcon } from '../icons';

/**
 * The editorial layer: masthead, mode control, action index, and the one solid
 * bar. Everything here is ruled and typeset rather than boxed — no pills, no
 * cards, no shadows, radii at 0–4. Structure comes from hairlines.
 *
 * These are presentation only. Every handler is passed in, so the screen keeps
 * owning what the app actually does.
 */

/** A 9.5–11px uppercase caption in muted ink. The only text under 15pt. */
export function Caption({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text
        style={[text.label, fontFor('en', 'semibold'), { color: colors.ink2 }]}
        allowFontScaling
        maxFontSizeMultiplier={1.4}
      >
        {children}
      </Text>
    </View>
  );
}

interface MastheadProps {
  language: Language;
  /** Shown instead of the language name while auto-detect is on. */
  detecting: boolean;
  disabled: boolean;
  onChangeLanguage: () => void;
  onSettings: () => void;
}

/** Language on the left, settings on the right, closed by a full-width rule. */
export function Masthead({ language, detecting, disabled, onChangeLanguage, onSettings }: MastheadProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  const en = t('en');
  const other = t(language.code);

  return (
    <View style={s.masthead}>
      <Pressable
        onPress={onChangeLanguage}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${other.changeLanguage}. ${en.changeLanguage}`}
        style={({ pressed }) => [s.mastheadSide, pressed && s.pressed, disabled && s.disabled]}
      >
        <Caption>IDIOMA</Caption>
        <View style={s.mastheadRow}>
          <Text
            style={[s.mastheadName, serifFor(detecting ? 'es' : language.code), { color: colors.ink }]}
            accessibilityLanguage={language.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.6}
          >
            {detecting ? other.auto : language.nativeName}
          </Text>
          <Text style={[text.caption, fontFor('en'), s.link, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            cambiar
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onSettings}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${other.about}. ${en.about}`}
        style={({ pressed }) => [s.settings, pressed && s.pressed, disabled && s.disabled]}
      >
        <Caption>AJUSTES</Caption>
        <View style={s.bars} importantForAccessibility="no">
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.bar, { backgroundColor: colors.ink }]} />
          ))}
        </View>
      </Pressable>
    </View>
  );
}

interface ModeProps {
  language: Language;
  auto: boolean;
  disabled: boolean;
  onSelect: (auto: boolean) => void;
}

/** Two halves in one bordered rectangle. The selected half fills solid. */
export function ModeControl({ language, auto, disabled, onSelect }: ModeProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  const other = t(language.code);

  const half = (isAuto: boolean, name: string, sub: string) => {
    const selected = auto === isAuto;
    return (
      <Pressable
        onPress={() => onSelect(isAuto)}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={`${name}. ${sub}`}
        style={({ pressed }) => [
          s.half,
          selected && { backgroundColor: colors.ctaFill },
          pressed && !selected && s.pressed,
        ]}
      >
        <View style={s.halfRow}>
          <View style={[s.dot, { backgroundColor: selected ? colors.accent : colors.ink2 }]} importantForAccessibility="no" />
          <Text
            style={[text.body, fontFor('en', 'semibold'), { color: selected ? colors.onCta : colors.ink }]}
            allowFontScaling
            maxFontSizeMultiplier={1.5}
          >
            {name}
          </Text>
        </View>
        <Text
          style={[text.label, fontFor('en', 'semibold'), { color: selected ? colors.onCta : colors.ink2 }]}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {sub}
        </Text>
      </Pressable>
    );
  };

  return (
    <View>
      <Caption style={s.captionGap}>MODO DE ENTRADA</Caption>
      <View style={[s.modeBox, { borderColor: colors.hairline }]} accessibilityRole="radiogroup">
        {/* Subs stay short enough to hold one line. "AUTO-DETECT LANGUAGE"
           wrapped and left the two halves visibly uneven. */}
        {half(false, other.oneLanguage, `${language.nativeName.toUpperCase()} → EN`)}
        <View style={[s.modeDivider, { backgroundColor: colors.hairline }]} />
        {half(true, other.detect, 'AUTO')}
      </View>
    </View>
  );
}

export interface ActionRow {
  key: string;
  /** Serif name in the patient's language. */
  name: string;
  /** Uppercase English on the right. */
  english: string;
  disabled?: boolean;
  onPress: () => void;
}

/** A numbered index of actions. Ruled rows, no fills, no containers. */
export function ActionIndex({ rows, lang, speechTag }: { rows: ActionRow[]; lang: string; speechTag: string }) {
  const { colors } = useTheme();
  const s = styles(colors);
  return (
    <View style={[s.index, { borderTopColor: colors.hairline }]}>
      {rows.map((row, i) => (
        <Pressable
          key={row.key}
          onPress={row.onPress}
          disabled={row.disabled}
          accessibilityRole="button"
          accessibilityLabel={`${row.name}. ${row.english}`}
          accessibilityLanguage={speechTag}
          style={({ pressed }) => [
            s.indexRow,
            { borderBottomColor: colors.hairline },
            pressed && s.pressed,
            row.disabled && s.disabled,
          ]}
        >
          <Text style={[s.numeral, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.3}>
            {String(i + 1).padStart(2, '0')}
          </Text>
          <Text
            style={[s.indexName, serifFor(lang), { color: colors.ink }]}
            allowFontScaling
            maxFontSizeMultiplier={1.6}
          >
            {row.name}
          </Text>
          <Text
            style={[text.label, fontFor('en', 'semibold'), s.indexEnglish, { color: colors.ink2 }]}
            allowFontScaling
            maxFontSizeMultiplier={1.4}
          >
            {row.english}
          </Text>
          <ChevronForwardIcon size={18} color={colors.ink2} />
        </Pressable>
      ))}
    </View>
  );
}

interface SpeakBarProps {
  /** Serif word on the bar, in the speaker's own language. */
  name: string;
  lang: string;
  speechTag?: string;
  /** Uppercase line beneath. */
  sub: string;
  disabled?: boolean;
  /**
   * Half-width form, for the two bars that share a row in two-language mode.
   * The mic loses its ruled cell and sits inline: a 62pt cell inside a ~170pt
   * bar leaves no room for the word itself.
   */
  compact?: boolean;
  onPress: () => void;
}

/** The one solid bar: an accent spine, the action, and the mic in its own cell. */
export function SpeakBar({ name, lang, speechTag, sub, disabled, compact = false, onPress }: SpeakBarProps) {
  const { colors } = useTheme();
  const s = styles(colors);
  return (
    <Pressable
      onPressIn={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${sub}`}
      accessibilityLanguage={speechTag}
      style={({ pressed }) => [
        s.cta,
        compact && s.ctaCompact,
        { backgroundColor: colors.ctaFill },
        pressed && s.ctaPressed,
        disabled && s.disabled,
      ]}
    >
      <View style={[s.spine, compact && s.spineCompact, { backgroundColor: colors.accent }]} importantForAccessibility="no" />
      <View style={[s.ctaText, compact && s.ctaTextCompact]}>
        <Text
          style={[s.ctaName, compact && s.ctaNameCompact, serifFor(lang), { color: colors.onCta }]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
        >
          {name}
        </Text>
        <Text
          style={[text.label, fontFor('en', 'semibold'), { color: colors.onCta }]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {sub}
        </Text>
      </View>
      {compact ? (
        <View style={s.micInline} importantForAccessibility="no">
          <MicIcon size={18} color={colors.onCta} />
        </View>
      ) : (
        <View style={[s.micCell, { borderLeftColor: colors.hairline }]} importantForAccessibility="no">
          <MicIcon size={22} color={colors.onCta} />
        </View>
      )}
    </Pressable>
  );
}

/** The footer line. Uppercase, muted, and the last word on the screen. */
export function PrivacyLine({ language }: { language: Language }) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(language.code);
  return (
    <Text
      style={[text.label, fontFor('en', 'semibold'), { color: colors.ink2, textAlign: 'center' }]}
      allowFontScaling
      maxFontSizeMultiplier={1.4}
    >
      {`${other.privacyShort} · ${en.privacyShort}`}
    </Text>
  );
}

/** Wraps children with the screen's own rule above. */
export function Rule({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline }]}>{children}</View>;
}

const styles = (c: ColorTokens) =>
  StyleSheet.create({
    masthead: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    mastheadSide: { gap: spacing.xxs, minHeight: tapTarget.min, justifyContent: 'flex-end' },
    mastheadRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
    mastheadName: { fontSize: 22, lineHeight: 28 },
    link: { textDecorationLine: 'underline' },
    settings: {
      alignItems: 'flex-end',
      gap: spacing.xxs,
      minHeight: tapTarget.min,
      justifyContent: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: c.hairline,
      paddingBottom: spacing.xxs,
    },
    bars: { gap: 3, width: 22 },
    bar: { height: 1.6, borderRadius: 1 },
    captionGap: { marginBottom: spacing.xs },
    modeBox: { flexDirection: 'row', borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
    modeDivider: { width: StyleSheet.hairlineWidth },
    half: { flex: 1, gap: spacing.xxs, padding: spacing.sm, minHeight: tapTarget.min, justifyContent: 'center' },
    halfRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    dot: { width: 5, height: 5, borderRadius: 3 },
    index: { borderTopWidth: StyleSheet.hairlineWidth },
    indexRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      // 56, not the 64 primary target: with the summary row the index is four
      // rows deep, and 4 × 64 left the live line nothing to occupy. Still well
      // clear of the 48 floor.
      minHeight: 56,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    numeral: { fontFamily: mono, fontSize: 12, letterSpacing: 0.5 },
    indexName: { flex: 1, fontSize: 22, lineHeight: 28 },
    indexEnglish: { textAlign: 'right' },
    cta: {
      flexDirection: 'row',
      alignItems: 'stretch',
      minHeight: 78,
      borderRadius: 4,
      overflow: 'hidden',
    },
    ctaPressed: { opacity: 0.9 },
    // Half-width, so it stays a comfortable target without a 78pt bar's bulk.
    ctaCompact: { flex: 1, minHeight: tapTarget.primary },
    spine: { width: 6 },
    spineCompact: { width: 4 },
    ctaText: { flex: 1, justifyContent: 'center', gap: 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    ctaTextCompact: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
    ctaName: { fontSize: 24, lineHeight: 30 },
    ctaNameCompact: { fontSize: 19, lineHeight: 25 },
    micCell: { width: 62, alignItems: 'center', justifyContent: 'center', borderLeftWidth: StyleSheet.hairlineWidth },
    micInline: { justifyContent: 'center', paddingRight: spacing.sm },
    pressed: { backgroundColor: 'rgba(29, 28, 26, 0.04)' },
    disabled: { opacity: 0.4 },
  });
