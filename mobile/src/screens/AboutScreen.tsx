import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Language } from '../config/languages';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../config/links';
import { t } from '../i18n/strings';
import { colors, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';

interface Props {
  otherLanguage: Language;
  onBack: () => void;
}

/** One small screen: what the app does and that nothing is stored, shown in
 * the selected language first with English below. */
export function AboutScreen({ otherLanguage, onBack }: Props) {
  const other = t(otherLanguage.code);
  const en = t('en');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={`${other.back} — ${en.back}`}
        style={({ pressed }) => [styles.back, pressed && styles.pressedDim]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={styles.backText}>
          {other.back} · {en.back}
        </Text>
      </Pressable>

      <Text style={styles.title} accessibilityRole="header">
        MedLingua
      </Text>

      <View style={styles.card}>
        <Text style={styles.heading} accessibilityLanguage={otherLanguage.speechTag}>
          {other.about}
        </Text>
        <Text style={styles.body} accessibilityLanguage={otherLanguage.speechTag}>
          {other.aboutBody}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>{en.about}</Text>
        <Text style={styles.body}>{en.aboutBody}</Text>
      </View>

      <View style={styles.disclaimerCard}>
        <Ionicons name="information-circle" size={22} color={colors.secondary} />
        <View style={styles.privacyBody}>
          <Text style={styles.privacyText} accessibilityLanguage={otherLanguage.speechTag}>
            {other.aiDisclaimer}
          </Text>
          <Text style={styles.privacyTextSmall}>{en.aiDisclaimer}</Text>
          <Text style={styles.privacyText} accessibilityLanguage={otherLanguage.speechTag}>
            {other.dataConsent}
          </Text>
          <Text style={styles.privacyTextSmall}>{en.dataConsent}</Text>
        </View>
      </View>

      <View style={styles.privacyCard}>
        <Ionicons name="lock-closed" size={22} color={colors.primary} />
        <View style={styles.privacyBody}>
          <Text style={styles.privacyText} accessibilityLanguage={otherLanguage.speechTag}>
            {other.privacyLine}
          </Text>
          <Text style={styles.privacyTextSmall}>{en.privacyLine}</Text>
        </View>
      </View>

      <View style={styles.legalRow}>
        <Pressable
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`${other.privacyPolicy} — ${en.privacyPolicy}`}
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressedDim]}
        >
          <Ionicons name="open-outline" size={18} color={colors.primary} />
          <View style={styles.legalLabels}>
            <Text style={styles.legalText} accessibilityLanguage={otherLanguage.speechTag}>
              {other.privacyPolicy}
            </Text>
            <Text style={styles.legalTextEn}>{en.privacyPolicy}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`${other.termsLabel} — ${en.termsLabel}`}
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressedDim]}
        >
          <Ionicons name="open-outline" size={18} color={colors.primary} />
          <View style={styles.legalLabels}>
            <Text style={styles.legalText} accessibilityLanguage={otherLanguage.speechTag}>
              {other.termsLabel}
            </Text>
            <Text style={styles.legalTextEn}>{en.termsLabel}</Text>
          </View>
        </Pressable>
      </View>
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
    gap: spacing.md,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: MIN_TARGET - 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingRight: spacing.sm,
    borderRadius: radius.pill,
  },
  pressedDim: {
    opacity: 0.6,
  },
  backText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: type.title,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  heading: {
    fontFamily: fonts.displayMedium,
    fontSize: type.body,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.text,
    lineHeight: type.body * 1.5,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceTintSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  privacyBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  privacyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.text,
    lineHeight: type.small * 1.45,
  },
  legalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  legalLink: {
    flex: 1,
    minHeight: MIN_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  legalLabels: {
    flexShrink: 1,
  },
  legalText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.primary,
  },
  legalTextEn: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  privacyTextSmall: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
    lineHeight: type.caption * 1.45,
  },
});
