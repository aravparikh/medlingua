import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { LANGUAGES, type Language } from '../config/languages';
import { STRINGS } from '../i18n/strings';
import { colors, displayFontFor, fonts, radius, shadows, spacing, type } from '../theme';
import { PressableScale } from '../components/PressableScale';

interface Props {
  onSelect: (language: Language) => void;
}

/**
 * The language picker. Each card shows the language in its own native script
 * with its flag, so a non-English speaker can recognize their language without
 * reading any English. "Choose your language" is repeated in every language.
 */
export function LanguageSelectScreen({ onSelect }: Props) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brand}>
        <View style={styles.brandMark} importantForAccessibility="no">
          <Ionicons name="chatbubble" size={26} color={colors.onPrimary} style={styles.brandBubble} />
          <Ionicons name="add" size={16} color={colors.primary} style={styles.brandCross} />
        </View>
        <Text style={styles.appName} accessibilityRole="header">
          MedLingua
        </Text>
      </View>

      <View style={styles.prompts} accessibilityRole="header">
        <Text style={styles.promptMain} allowFontScaling maxFontSizeMultiplier={2}>
          {STRINGS.en.chooseLanguage}
        </Text>
        {LANGUAGES.map((l) => (
          <Text
            key={l.code}
            style={styles.prompt}
            allowFontScaling
            maxFontSizeMultiplier={2}
            accessibilityLanguage={l.speechTag}
          >
            {STRINGS[l.code].chooseLanguage}
          </Text>
        ))}
      </View>

      {LANGUAGES.map((language) => (
        <PressableScale
          key={language.code}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelect(language);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${language.nativeName} — English`}
          accessibilityLanguage={language.speechTag}
          style={styles.card}
        >
          <View style={styles.flagCircle} importantForAccessibility="no">
            <Text style={[styles.monogram, { fontFamily: displayFontFor(language.code) }]}>
              {language.monogram}
            </Text>
          </View>
          <View style={styles.cardText}>
            <Text
              style={[styles.nativeName, { fontFamily: displayFontFor(language.code) }]}
              allowFontScaling
              maxFontSizeMultiplier={2}
            >
              {language.nativeName}
            </Text>
            <Text style={styles.pairing} allowFontScaling maxFontSizeMultiplier={2}>
              {language.nativeName}  ·  English
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={26} color={colors.textFaint} />
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBubble: {
    position: 'absolute',
  },
  brandCross: {
    position: 'absolute',
    marginTop: -2,
  },
  appName: {
    fontFamily: fonts.display,
    fontSize: type.title,
    color: colors.primary,
  },
  prompts: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xxs,
    alignItems: 'center',
  },
  promptMain: {
    fontFamily: fonts.displayMedium,
    fontSize: type.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  prompt: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 92,
    gap: spacing.md,
    ...shadows.card,
  },
  flagCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogram: {
    fontSize: 26,
    color: colors.primary,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  nativeName: {
    fontFamily: fonts.displayMedium,
    fontSize: type.title,
    color: colors.text,
  },
  pairing: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
  },
});
