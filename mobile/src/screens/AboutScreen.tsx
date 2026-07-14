import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import type { Language } from '../config/languages';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../config/links';
import { t } from '../i18n/strings';
import { colors, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';
import { PressableScale } from '../components/PressableScale';
import { RightsCard } from '../components/RightsCard';

interface Props {
  otherLanguage: Language;
  onBack: () => void;
}

/** One small screen: what the app does and that nothing is stored, shown in
 * the selected language first with English below. */
export function AboutScreen({ otherLanguage, onBack }: Props) {
  const other = t(otherLanguage.code);
  const en = t('en');
  const [rightsOpen, setRightsOpen] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={`${other.back} — ${en.back}`}
        style={({ pressed }) => [styles.back, pressed && styles.pressedDim]}
      >
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={styles.backText} allowFontScaling maxFontSizeMultiplier={1.3}>
          {other.back} · {en.back}
        </Text>
      </Pressable>

      <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header">
        MedLingua
      </Text>

      {/* One tap to the interpreter-rights card — the screen made to be
         handed to staff. Most patients don't know this right exists. */}
      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setRightsOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${other.rightsShow} — ${en.rightsShow}. ${other.rightsTitle}`}
        style={styles.rightsEntry}
      >
        <View style={styles.rightsIcon} importantForAccessibility="no">
          <Ionicons name="shield-checkmark" size={28} color={colors.onPrimary} />
        </View>
        <View style={styles.rightsTextWrap}>
          <Text style={styles.rightsEntryTitle} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
            {other.rightsShow}
          </Text>
          <Text style={styles.rightsEntrySub} allowFontScaling maxFontSizeMultiplier={1.3}>{en.rightsShow}</Text>
        </View>
        <Ionicons name="chevron-forward" size={26} color={colors.onPrimary} importantForAccessibility="no" />
      </PressableScale>

      <View style={styles.card}>
        <Text style={styles.heading} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
          {other.about}
        </Text>
        <Text style={styles.body} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
          {other.aboutBody}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading} allowFontScaling maxFontSizeMultiplier={2}>{en.about}</Text>
        <Text style={styles.body} allowFontScaling maxFontSizeMultiplier={2}>{en.aboutBody}</Text>
      </View>

      <View style={styles.disclaimerCard}>
        <Ionicons name="information-circle" size={22} color={colors.secondary} />
        <View style={styles.privacyBody}>
          <Text style={styles.privacyText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
            {other.aiDisclaimer}
          </Text>
          <Text style={styles.privacyTextSmall} allowFontScaling maxFontSizeMultiplier={2}>{en.aiDisclaimer}</Text>
          <Text style={styles.privacyText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
            {other.dataConsent}
          </Text>
          <Text style={styles.privacyTextSmall} allowFontScaling maxFontSizeMultiplier={2}>{en.dataConsent}</Text>
        </View>
      </View>

      <View style={styles.privacyCard}>
        <Ionicons name="lock-closed" size={22} color={colors.primary} />
        <View style={styles.privacyBody}>
          <Text style={styles.privacyText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
            {other.privacyLine}
          </Text>
          <Text style={styles.privacyTextSmall} allowFontScaling maxFontSizeMultiplier={2}>{en.privacyLine}</Text>
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
            <Text style={styles.legalText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
              {other.privacyPolicy}
            </Text>
            <Text style={styles.legalTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.privacyPolicy}</Text>
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
            <Text style={styles.legalText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
              {other.termsLabel}
            </Text>
            <Text style={styles.legalTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.termsLabel}</Text>
          </View>
        </Pressable>
      </View>

      <RightsCard visible={rightsOpen} otherLanguage={otherLanguage} onClose={() => setRightsOpen(false)} />
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
  rightsEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: MIN_TARGET + 8,
    ...shadows.raised,
  },
  rightsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.onPrimaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightsTextWrap: {
    flex: 1,
    gap: spacing.hairline,
  },
  rightsEntryTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: type.body,
    color: colors.onPrimary,
  },
  rightsEntrySub: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.onPrimary,
    opacity: 0.9,
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
    fontSize: type.micro,
    color: colors.textMuted,
  },
  privacyTextSmall: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
    lineHeight: type.caption * 1.45,
  },
});
