import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import {
  fontFor,
  gradients,
  serifFor,
  useTheme,
  type ColorTokens,
} from '../../theme';
import { ChevronForwardIcon, MicIcon } from '../icons';

/**
 * The Sage editorial layer: masthead, hero, mode control, action index, and
 * the speak card. White cards on the shared gradient ground — radii 26/22,
 * one shadow, stroked 1.6px icons. Presentation only; handlers stay with the
 * screen.
 */

/** A 12px uppercase section label in soft ink. Case lives in the string. */
export function Caption({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text
        style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.inkSoft }]}
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
  /** Listening hides the cambiar link and freezes both links. */
  quiet?: boolean;
  onChangeLanguage: () => void;
  onSettings: () => void;
}

/** Language on the left, a plain AJUSTES text link on the right. No icon. */
export function Masthead({ language, detecting, disabled, quiet = false, onChangeLanguage, onSettings }: MastheadProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(language.code);
  const frozen = disabled || quiet;

  return (
    <View style={s.masthead}>
      <View style={s.mastheadSide}>
        <Text
          style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.inkSoft }]}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {other.idiomaLabel}
        </Text>
        <View style={s.mastheadRow}>
          <Text
            style={[s.mastheadName, serifFor(detecting ? 'es' : language.code, 'medium'), { color: colors.ink }]}
            accessibilityLanguage={language.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.6}
          >
            {detecting ? other.auto : language.nativeName}
          </Text>
          {quiet ? null : (
            <Pressable
              onPress={onChangeLanguage}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`${other.changeLanguage}. ${en.changeLanguage}`}
              style={({ pressed }) => [pressed && s.pressed]}
            >
              <Text style={[s.cambiar, fontFor(language.code, 'semibold'), { color: colors.accent, borderBottomColor: colors.mint }]} allowFontScaling maxFontSizeMultiplier={1.4}>
                {other.changeShort}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        onPress={onSettings}
        disabled={frozen}
        accessibilityRole="button"
        accessibilityLabel={`${other.about}. ${en.about}`}
        style={({ pressed }) => [s.settings, pressed && s.pressed, frozen && s.disabled]}
      >
        <Text
          style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.inkSoft }]}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {other.settingsLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Split a tagline at its em dash: head regular, tail italic. */
function splitTagline(tagline: string): [string, string] {
  const at = tagline.indexOf('—');
  if (at < 0) return [tagline, ''];
  return [tagline.slice(0, at + 1), tagline.slice(at + 1)];
}

/** The home hero: patient tagline big in Newsreader, English beneath. */
export function Hero({ language }: { language: Language }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(language.code);
  const [head, tail] = splitTagline(other.tagline);

  return (
    <View style={s.hero} accessibilityRole="header">
      <Text style={[s.heroHead, serifFor(language.code), { color: colors.ink }]} accessibilityLanguage={language.speechTag} allowFontScaling maxFontSizeMultiplier={1.6}>
        {head}
        {tail ? <Text style={serifFor(language.code, 'italic')}>{tail}</Text> : null}
      </Text>
      {other.tagline === en.tagline ? null : (
        <Text style={[s.heroSub, fontFor('en'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={1.6}>
          {en.tagline}
        </Text>
      )}
    </View>
  );
}

interface ModeProps {
  language: Language;
  auto: boolean;
  disabled: boolean;
  /** Conversation state: tighter option padding. */
  compact?: boolean;
  onSelect: (auto: boolean) => void;
}

/** Two pills in one white pill container. The selected pill fills ink. */
export function ModeControl({ language, auto, disabled, compact = false, onSelect }: ModeProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const other = t(language.code);
  const en = t('en');

  const half = (isAuto: boolean, name: string, sub: string, tight: boolean) => {
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
          tight && s.halfCompact,
          selected && { backgroundColor: colors.ink },
          pressed && !selected && s.pressed,
        ]}
      >
        <Text
          style={[{ fontSize: 15, lineHeight: 20 }, fontFor('en', 'semibold'), { color: selected ? colors.white : colors.ink }]}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
        >
          {name}
        </Text>
        <Text
          style={[
            { fontSize: 11, lineHeight: 14, letterSpacing: 0.9 },
            fontFor('en', 'semibold'),
            { color: selected ? colors.white : colors.inkSoft, opacity: selected ? 0.65 : 1 },
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
      <View style={s.modeLabel}>
        <Caption>{other.inputModeLabel}</Caption>
      </View>
      <View style={[s.modeBox, { backgroundColor: colors.white }]} accessibilityRole="radiogroup">
        {half(false, other.oneLanguage, `${language.nativeName.toUpperCase()} → EN`, compact)}
        {half(true, other.detect, en.auto.toUpperCase(), compact)}
      </View>
    </View>
  );
}

export interface ActionRow {
  key: string;
  /** Serif name in the patient's language. */
  name: string;
  /** English beneath, in the patient's language list. */
  english: string;
  disabled?: boolean;
  onPress: () => void;
}

/** Numbered white action cards with mint badges and cream chevrons. */
export function ActionIndex({
  rows,
  lang,
  speechTag,
  tiles = false,
}: {
  rows: ActionRow[];
  lang: string;
  speechTag: string;
  /** Conversation state: three equal tiles in a row instead of cards. */
  tiles?: boolean;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  if (tiles) {
    const lead = rows.length > 3 ? rows.slice(0, 1) : [];
    const rest = rows.length > 3 ? rows.slice(1) : rows;
    return (
      <View style={s.tiles}>
        {lead.map((row) => (
          <Pressable
            key={row.key}
            onPress={row.onPress}
            disabled={row.disabled}
            accessibilityRole="button"
            accessibilityLabel={`${row.name}. ${row.english}`}
            accessibilityLanguage={speechTag}
            style={({ pressed }) => [s.tileLead, { backgroundColor: colors.white }, pressed && s.pressed, row.disabled && s.disabled]}
          >
            <Text style={[{ fontSize: 11, lineHeight: 14 }, fontFor('en', 'semibold'), { color: colors.accent }]}>
              {String(rows.indexOf(row) + 1).padStart(2, '0')}
            </Text>
            <Text style={[s.tileName, serifFor(lang, 'medium'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.6}>
              {row.name}
            </Text>
            <Text style={[{ fontSize: 12, lineHeight: 16 }, fontFor('en'), { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={1.6}>
              {row.english}
            </Text>
          </Pressable>
        ))}
        <View style={s.tileRow}>
          {rest.map((row) => {
            const number = String(rows.indexOf(row) + 1).padStart(2, '0');
            return (
              <Pressable
                key={row.key}
                onPress={row.onPress}
                disabled={row.disabled}
                accessibilityRole="button"
                accessibilityLabel={`${row.name}. ${row.english}`}
                accessibilityLanguage={speechTag}
                style={({ pressed }) => [s.tile, { backgroundColor: colors.white }, pressed && s.pressed, row.disabled && s.disabled]}
              >
                <Text style={[{ fontSize: 11, lineHeight: 14 }, fontFor('en', 'semibold'), { color: colors.accent }]}>
                  {number}
                </Text>
                <Text style={[s.tileName, serifFor(lang, 'medium'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.6}>
                  {row.name}
                </Text>
                <Text style={[{ fontSize: 12, lineHeight: 16 }, fontFor('en'), { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={1.6}>
                  {row.english}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
  return (
    <View style={s.index}>
      {rows.map((row, i) => (
        <Pressable
          key={row.key}
          onPress={row.onPress}
          disabled={row.disabled}
          accessibilityRole="button"
          accessibilityLabel={`${row.name}. ${row.english}`}
          accessibilityLanguage={speechTag}
          style={({ pressed }) => [s.indexRow, { backgroundColor: colors.white }, pressed && s.pressed, row.disabled && s.disabled]}
        >
          <View style={[s.badge, { backgroundColor: colors.mintLight }]} importantForAccessibility="no">
            <Text style={[{ fontSize: 12, lineHeight: 16 }, fontFor('en', 'semibold'), { color: colors.accent }]}>
              {String(i + 1).padStart(2, '0')}
            </Text>
          </View>
          <View style={s.indexText}>
            <Text
              style={[s.indexName, serifFor(lang, 'medium'), { color: colors.ink }]}
              allowFontScaling
              maxFontSizeMultiplier={1.6}
            >
              {row.name}
            </Text>
            <Text
              style={[{ fontSize: 13, lineHeight: 18 }, fontFor('en'), { color: colors.muted }]}
              allowFontScaling
              maxFontSizeMultiplier={1.6}
            >
              {row.english}
            </Text>
          </View>
          <View style={[s.chevronCircle, { backgroundColor: colors.cream }]} importantForAccessibility="no">
            <ChevronForwardIcon size={14} color={colors.inkSoft} />
          </View>
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
  /** Half-width form for the two bars sharing a row in two-language mode. */
  compact?: boolean;
  /** Conversation state: slightly smaller title and padding. */
  condensed?: boolean;
  /** Listening: pulse the mic circle. */
  listening?: boolean;
  onPress: () => void;
}

/** The primary speak card: selected-gradient fill, mint border, ink mic. */
export function SpeakBar({ name, lang, speechTag, sub, disabled, compact = false, condensed = false, listening = false, onPress }: SpeakBarProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!listening) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

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
        condensed && !compact && s.ctaCondensed,
        { borderColor: colors.mint },
        pressed && s.ctaPressed,
        disabled && s.disabled,
      ]}
    >
      <LinearGradient
        colors={[...gradients.selected.colors]}
        locations={[...gradients.selected.locations]}
        start={gradients.selected.start}
        end={gradients.selected.end}
        style={[StyleSheet.absoluteFill, { borderRadius: compact ? 22 : 26 }]}
        importantForAccessibility="no"
      />
      <View style={s.ctaText}>
        <Text
          style={[compact ? s.ctaNameCompact : condensed ? s.ctaNameCondensed : s.ctaName, serifFor(lang, 'medium'), { color: colors.ink }]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
        >
          {name}
        </Text>
        <Text
          style={[{ fontSize: 11, lineHeight: 14, letterSpacing: 1 }, fontFor('en', 'semibold'), { color: colors.accent }]}
          numberOfLines={1}
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {sub}
        </Text>
      </View>
      <Animated.View style={[compact ? s.micCompact : s.mic, { backgroundColor: colors.ink, transform: [{ scale: pulse }] }]} importantForAccessibility="no">
        <MicIcon size={compact ? 20 : 22} color={colors.white} />
      </Animated.View>
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
      style={[{ fontSize: 11, lineHeight: 15, letterSpacing: 1.1 }, fontFor('en'), { color: colors.muted, textAlign: 'center' }]}
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
      paddingHorizontal: 24,
      paddingTop: 4,
    },
    mastheadSide: { gap: 2, minHeight: 44, justifyContent: 'center' },
    mastheadRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    mastheadName: { fontSize: 30, lineHeight: 36 },
    cambiar: {
      fontSize: 14,
      lineHeight: 20,
      borderBottomWidth: 1.5,
      paddingBottom: 1,
    },
    settings: { minHeight: 44, justifyContent: 'center' },
    hero: { paddingHorizontal: 24, marginTop: 34 },
    heroHead: { fontSize: 36, lineHeight: 39, letterSpacing: -0.72 },
    heroSub: { fontSize: 15, lineHeight: 22, marginTop: 10 },
    modeWrap: { paddingHorizontal: 16, marginTop: 20 },
    modeLabel: { paddingHorizontal: 8, marginBottom: 8 },
    modeBox: { flexDirection: 'row', borderRadius: 999, padding: 5, gap: 4 },
    half: { flex: 1, gap: 2, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, minHeight: 56, justifyContent: 'center' },
    halfCompact: { paddingVertical: 10 },
    index: { paddingHorizontal: 16, gap: 10, marginTop: 14 },
    tiles: { paddingHorizontal: 16, gap: 8, marginTop: 14 },
    tileRow: { flexDirection: 'row', gap: 8 },
    tile: { flex: 1, minWidth: 0, gap: 3, minHeight: 112, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 20 },
    tileLead: { gap: 3, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 22 },
    tileName: { fontSize: 20, lineHeight: 24 },
    indexRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: 76,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 22,
    },
    badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    indexText: { flex: 1, minWidth: 0 },
    indexName: { fontSize: 24, lineHeight: 29 },
    chevronCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 96,
      borderWidth: 1.5,
      borderRadius: 26,
      overflow: 'hidden',
      paddingVertical: 22,
      paddingHorizontal: 24,
    },
    ctaPressed: { opacity: 0.94 },
    ctaCompact: { flex: 1, minHeight: 84, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18 },
    ctaCondensed: { paddingVertical: 20, paddingHorizontal: 24 },
    ctaText: { flex: 1, justifyContent: 'center', gap: 4, minWidth: 0 },
    ctaName: { fontSize: 34, lineHeight: 38 },
    ctaNameCompact: { fontSize: 26, lineHeight: 30 },
    ctaNameCondensed: { fontSize: 32, lineHeight: 36 },
    mic: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    micCompact: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.96 },
    disabled: { opacity: 0.4 },
  });
