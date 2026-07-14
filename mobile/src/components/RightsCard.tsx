import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { colors, displayFontFor, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';

interface Props {
  visible: boolean;
  otherLanguage: Language;
  onClose: () => void;
}

/**
 * The interpreter-rights card. Title VI of the Civil Rights Act and §1557 of
 * the ACA entitle every patient to a free, qualified medical interpreter —
 * and most patients don't know it. This screen exists to be handed to staff:
 * patient language first and large, English below, fully static and offline.
 */
export function RightsCard({ visible, otherLanguage, onClose }: Props) {
  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View style={styles.badge} importantForAccessibility="no">
            <Ionicons name="shield-checkmark" size={26} color={colors.onPrimary} />
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close} — ${en.close}`}
            style={({ pressed }) => [styles.close, pressed && styles.pressedDim]}
          >
            <Ionicons name="close" size={24} color={colors.primary} />
            <Text style={styles.closeText} allowFontScaling maxFontSizeMultiplier={1.3}>
              {other.close} · {en.close}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text
            style={[styles.title, { fontFamily: displayFontFor(otherLanguage.code) }]} allowFontScaling maxFontSizeMultiplier={2}
            accessibilityRole="header"
            accessibilityLanguage={otherLanguage.speechTag}
          >
            {other.rightsTitle}
          </Text>
          <Text style={styles.body} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
            {other.rightsBody}
          </Text>

          <View style={styles.divider} importantForAccessibility="no" />

          <Text style={styles.titleEn} allowFontScaling maxFontSizeMultiplier={2}>{en.rightsTitle}</Text>
          <Text style={styles.bodyEn} allowFontScaling maxFontSizeMultiplier={2}>{en.rightsBody}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  close: {
    minHeight: MIN_TARGET - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  pressedDim: {
    opacity: 0.6,
  },
  closeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: type.title,
    color: colors.text,
    lineHeight: type.title * 1.25,
  },
  body: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.text,
    lineHeight: type.body * 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  titleEn: {
    fontFamily: fonts.displayMedium,
    fontSize: type.button,
    color: colors.textMuted,
    lineHeight: type.button * 1.3,
  },
  bodyEn: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    lineHeight: type.small * 1.5,
  },
});
