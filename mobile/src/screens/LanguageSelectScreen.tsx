import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { LANGUAGES, type Language } from '../config/languages';
import { STRINGS, t } from '../i18n/strings';
import { loadPrefs } from '../services/storage';
import { fontFor, serifFor, spacing, tapTarget, useTheme, type ColorTokens } from '../theme';
import { WaveMark } from '../components/icons';

interface Props {
  onSelect: (language: Language) => void;
}

/**
 * Home, set as a title page: the mark, the wordmark, and an index of
 * languages ruled with hairlines.
 *
 * Hierarchy here comes from serif against sans and from letter-spacing, never
 * from weight — nothing on this screen is bold, and the 30pt wordmark is the
 * largest thing on it. Each language is set in its own script at a size that
 * can be recognised without reading English, which is what makes the list the
 * onboarding.
 *
 * The lockup is fixed and only the list scrolls, so the mark never leaves.
 */
export function LanguageSelectScreen({ onSelect }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  // Whichever language this device chose last, so returning to the screen
  // shows where you left off rather than an unmarked list.
  const [chosenCode] = useState(() => loadPrefs().languageCode);

  return (
    <View style={s.screen}>
      <View style={s.lockup}>
        <WaveMark size={40} />
        <Text style={[s.wordmark, serifFor('en'), { color: colors.ink }]} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={1.4}>
          MedLingua
        </Text>
        <Text style={[s.eyebrow, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.6}>
          CLINICAL TRANSLATION
        </Text>
        <Text style={[s.tagline, fontFor('en'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.8}>
          {STRINGS.en.tagline}
        </Text>
      </View>

      <Text style={[s.listLabel, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.6}>
        CHOOSE YOUR LANGUAGE
      </Text>

      <ScrollView style={[s.list, { borderTopColor: colors.hairline }]} contentContainerStyle={s.listContent}>
        {LANGUAGES.map((language) => {
          const chosen = language.code === chosenCode;
          return (
            <Pressable
              key={language.code}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(language);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: chosen }}
              accessibilityLabel={`${language.nativeName}. ${language.englishName}`}
              accessibilityLanguage={language.speechTag}
              style={({ pressed }) => [s.row, { borderBottomColor: colors.rule }, pressed && s.pressed]}
            >
              <View style={s.rowText}>
                <Text style={[s.native, serifFor(language.code), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.8}>
                  {language.nativeName}
                </Text>
                <Text style={[s.english, fontFor('en'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.8}>
                  {language.englishName}
                </Text>
              </View>
              {chosen ? (
                <Text
                  style={[s.tag, fontFor(language.code, 'semibold'), { color: colors.ink, borderBottomColor: colors.ink }]}
                  allowFontScaling
                  maxFontSizeMultiplier={1.6}
                >
                  {t(language.code).chosen.toUpperCase()}
                </Text>
              ) : (
                <View style={[s.chevron, { borderColor: colors.ink2 }]} importantForAccessibility="no" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    lockup: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
    wordmark: { fontSize: 30, lineHeight: 32 },
    eyebrow: { fontSize: 9, letterSpacing: 2.4, marginTop: -spacing.xs },
    tagline: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 240 },
    listLabel: { fontSize: 10, letterSpacing: 1.6, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xs },
    list: { flex: 1, minHeight: 0, borderTopWidth: StyleSheet.hairlineWidth },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: tapTarget.primary,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pressed: { backgroundColor: 'rgba(29, 28, 26, 0.04)' },
    rowText: { flex: 1 },
    native: { fontSize: 20, lineHeight: 27 },
    english: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
    tag: { fontSize: 9.5, letterSpacing: 1.3, borderBottomWidth: 1, paddingBottom: 2 },
    // A chevron drawn from two borders, so it needs no icon and no stroke.
    chevron: { width: 7, height: 7, borderRightWidth: 2.2, borderBottomWidth: 2.2, transform: [{ rotate: '-45deg' }] },
  });
