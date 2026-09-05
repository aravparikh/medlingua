import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { LANGUAGES, type Language } from '../config/languages';
import { STRINGS } from '../i18n/strings';
import { fontFor, serifFor, spacing, tapTarget, text, useTheme, type ColorTokens } from '../theme';
import { BrandMark, ChevronForwardIcon } from '../components/icons';

interface Props {
  onSelect: (language: Language) => void;
}

/**
 * Home. One tap from here to the conversation.
 *
 * The rows ARE the onboarding: each language is set in its own script at a
 * size that can be recognised without reading, so a patient who reads no
 * English finds their row the same way they would find their name on a door.
 * The only English on the screen is the wordmark, the tagline, and the
 * clinician's one-line instruction — the people setting up a clinic tablet.
 */
export function LanguageSelectScreen({ onSelect }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.brand}>
        <BrandMark size={40} color={colors.accent} cross={colors.bg} />
        <Text style={[text.heading, serifFor('en'), { color: colors.ink }]} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={1.3}>
          MedLingua
        </Text>
        <Text style={[text.body, fontFor('en'), s.tagline, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={2}>
          {STRINGS.en.tagline}
        </Text>
      </View>

      <Text style={[text.label, fontFor('en', 'semibold'), s.prompt, { color: colors.ink2 }]} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={2}>
        {STRINGS.en.chooseLanguage}
      </Text>

      <View style={[s.list, { borderTopColor: colors.rule }]}>
        {LANGUAGES.map((language) => (
          <Pressable
            key={language.code}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelect(language);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${language.nativeName}. English`}
            accessibilityLanguage={language.speechTag}
            style={({ pressed }) => [s.row, { borderBottomColor: colors.rule }, pressed && { backgroundColor: colors.surfacePressed }]}
          >
            <View style={s.rowText}>
              <Text style={[text.title, serifFor(language.code), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={2}>
                {language.nativeName}
              </Text>
              <Text style={[text.caption, fontFor('en'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={2}>
                {language.englishName}
              </Text>
            </View>
            <ChevronForwardIcon size={24} color={colors.ink2} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
    brand: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
    tagline: { textAlign: 'center' },
    prompt: { marginTop: spacing.xxl, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
    list: { borderTopWidth: StyleSheet.hairlineWidth },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: tapTarget.primary + spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowText: { flex: 1, gap: spacing.xxs },
  });
