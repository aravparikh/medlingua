import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import {
  fontFor,
  mono,
  serifFor,
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

/** A 9.5px uppercase caption in muted ink. Case lives in the string itself. */
export function Caption({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text
        style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ink2 }]}
        allowFontScaling
        maxFontSizeMultiplier={1.4}
      >
        {children}
      </Text>
    </View>
  );
}

/** Three stroked bars, transparent — no circle, no fill, no shadow. */
function BarsIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round">
      <Path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
    </Svg>
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
  const s = useMemo(() => makeStyles(colors), [colors]);
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
        <Text
          style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.5 }, fontFor('en', 'semibold'), { color: colors.ink2 }]}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {other.idiomaLabel}
        </Text>
        <View style={s.mastheadRow}>
          <Text
            style={[s.mastheadName, serifFor(detecting ? 'es' : language.code), { color: colors.ink }]}
            accessibilityLanguage={language.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.6}
          >
            {detecting ? other.auto : language.nativeName}
          </Text>
          <Text style={[s.cambiar, fontFor(language.code), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {other.changeShort}
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
        <Text
          style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ink2 }]}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {other.settingsLabel}
        </Text>
        <View importantForAccessibility="no">
          <BarsIcon color={colors.ink} />
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
  const s = useMemo(() => makeStyles(colors), [colors]);
  const other = t(language.code);
  const en = t('en');

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
        <Text
          style={[{ fontSize: 12, lineHeight: 16 }, fontFor('en', 'semibold'), { color: selected ? colors.onCta : colors.ink }]}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
        >
          {name}
        </Text>
        <Text
          style={[
            { fontSize: 9, lineHeight: 12, letterSpacing: 1.2 },
            fontFor('en', 'semibold'),
            { color: selected ? colors.onCta : colors.ink2, opacity: selected ? 0.6 : 1 },
          ]}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {sub}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={s.modeWrap}>
      <View style={s.captionGap}>
        <Caption>{other.inputModeLabel}</Caption>
      </View>
      <View style={[s.modeBox, { borderColor: colors.hairline }]} accessibilityRole="radiogroup">
        {half(false, other.oneLanguage, `${language.nativeName.toUpperCase()} → EN`)}
        <View style={[s.modeDivider, { backgroundColor: colors.hairline }]} />
        {half(true, other.detect, en.auto.toUpperCase())}
      </View>
    </View>
  );
}

export interface ActionRow {
  key: string;
  /** Serif name in the patient's language. */
  name: string;
  /** English on the right, uppercased at render (never via textTransform). */
  english: string;
  disabled?: boolean;
  onPress: () => void;
}

/** A numbered index of actions. Ruled rows, no fills, no containers. */
export function ActionIndex({ rows, lang, speechTag }: { rows: ActionRow[]; lang: string; speechTag: string }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
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
            { borderBottomColor: colors.rule },
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
            style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.1 }, fontFor('en', 'semibold'), { color: colors.ink2 }]}
            allowFontScaling
            maxFontSizeMultiplier={1.4}
          >
            {row.english.toUpperCase()}
          </Text>
          <ChevronForwardIcon size={12} color={colors.ink2} />
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
   */
  compact?: boolean;
  onPress: () => void;
}

/** The one solid bar: the action and a 16px stroked mic at the right. */
export function SpeakBar({ name, lang, speechTag, sub, disabled, compact = false, onPress }: SpeakBarProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
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
      <View style={s.ctaText}>
        <Text
          style={[s.ctaName, serifFor(lang), { color: colors.onCta }]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
        >
          {name}
        </Text>
        <Text
          style={[{ fontSize: 9, lineHeight: 12, letterSpacing: 1.2 }, fontFor('en', 'regular'), { color: colors.onCta, opacity: 0.6 }]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {sub}
        </Text>
      </View>
      <View style={s.micInline} importantForAccessibility="no">
        <MicIcon size={16} color={colors.onCta} />
      </View>
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
      style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.1 }, fontFor('en', 'regular'), { color: colors.ink2, textAlign: 'center' }]}
      allowFontScaling
      maxFontSizeMultiplier={1.4}
    >
      {`${other.privacyShort} · ${en.privacyShort}`.toUpperCase()}
    </Text>
  );
}

/** Wraps children with the screen's own rule above. */
export function Rule({ children }: { children?: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.hairline }]}>{children}</View>;
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    masthead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.hairline,
    },
    mastheadSide: { gap: 3, minHeight: 48, justifyContent: 'center' },
    mastheadRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    mastheadName: { fontSize: 18, lineHeight: 24 },
    cambiar: {
      fontSize: 11,
      lineHeight: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.ink2,
      paddingBottom: 1,
    },
    settings: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 48,
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    captionGap: { marginBottom: 8 },
    modeWrap: { paddingHorizontal: 22, paddingTop: 12 },
    modeBox: { flexDirection: 'row', borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
    modeDivider: { width: 1 },
    half: { flex: 1, gap: 2, paddingHorizontal: 12, paddingVertical: 9, minHeight: 48, justifyContent: 'center' },
    index: { borderTopWidth: 1, marginTop: 12, paddingHorizontal: 22 },
    indexRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 48,
      paddingVertical: 12,
      paddingHorizontal: 2,
      borderBottomWidth: 1,
    },
    numeral: { fontFamily: mono, fontSize: 10, fontWeight: '500' },
    indexName: { flex: 1, fontSize: 18, lineHeight: 24 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 60,
      borderRadius: 4,
      overflow: 'hidden',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    ctaPressed: { opacity: 0.9 },
    // Half-width, so it stays a comfortable target without a tall bar's bulk.
    ctaCompact: { flex: 1 },
    ctaText: { flex: 1, justifyContent: 'center', gap: 1 },
    ctaName: { fontSize: 17, lineHeight: 22 },
    micInline: { justifyContent: 'center' },
    pressed: { backgroundColor: 'rgba(29, 28, 26, 0.04)' },
    disabled: { opacity: 0.4 },
  });
