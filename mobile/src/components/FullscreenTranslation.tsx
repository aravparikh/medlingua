import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { colors, fonts, MIN_TARGET, radius, spacing, type } from '../theme';
import { PressableScale } from './PressableScale';

interface Props {
  /** The translation to display, or null when hidden. */
  text: string | null;
  /** Language the text is in — drives the a11y language tag. */
  language: Language | null;
  /** The conversation's non-English side, for bilingual chrome labels. */
  otherLanguage: Language;
  onClose: () => void;
}

/**
 * Deterministic "largest type that fits" — adjustsFontSizeToFit is unreliable
 * on web, so size by length instead. Steps chosen so a short answer ("Sí.")
 * fills the room while a long instruction stays readable without scrolling.
 */
function fitFontSize(text: string): number {
  const len = text.length;
  if (len <= 16) return 72;
  if (len <= 40) return 56;
  if (len <= 90) return 44;
  if (len <= 170) return 34;
  if (len <= 300) return 27;
  return 22;
}

/**
 * A translation blown up to fill the whole screen — for loud rooms, low vision,
 * or holding the phone across a bed rail (flip turns it toward the other
 * person). Tap anywhere to dismiss.
 */
export function FullscreenTranslation({ text, language, otherLanguage, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);
  const en = t('en');
  const other = t(otherLanguage.code);

  // A fresh open always starts unflipped, whatever the last session did.
  useEffect(() => {
    if (text != null) setFlipped(false);
  }, [text]);

  if (text == null || language == null) return null;
  const fontSize = fitFontSize(text);

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.screen}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={`${other.tapToClose} — ${en.tapToClose}`}
      >
        <View style={styles.topBar}>
          <PressableScale
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFlipped(!flipped);
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: flipped }}
            accessibilityLabel={`${other.flip} — ${en.flip}`}
            style={[styles.topButton, flipped && styles.topButtonActive]}
          >
            <Ionicons name="swap-vertical" size={22} color={colors.primary} />
            <Text style={styles.topButtonText} allowFontScaling maxFontSizeMultiplier={2}>
              {other.flip === en.flip ? en.flip : `${other.flip} · ${en.flip}`}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={`${other.close} — ${en.close}`}
            style={styles.topButton}
          >
            <Ionicons name="close" size={24} color={colors.primary} />
            <Text style={styles.topButtonText} allowFontScaling maxFontSizeMultiplier={2}>
              {other.close === en.close ? en.close : `${other.close} · ${en.close}`}
            </Text>
          </PressableScale>
        </View>

        <View style={[styles.body, flipped && styles.bodyFlipped]}>
          <Text
            style={[styles.bigText, { fontSize, lineHeight: fontSize * 1.2 }]}
            accessibilityLanguage={language.speechTag}
            accessibilityLiveRegion="polite"
            // Already sized to the largest type that fits — scaling on top
            // of that would push text off-screen with no way to scroll.
            allowFontScaling={false}
          >
            {text}
          </Text>
        </View>

        <Text style={styles.closeHint} allowFontScaling maxFontSizeMultiplier={1.3} importantForAccessibility="no">
          {other.tapToClose === en.tapToClose ? en.tapToClose : `${other.tapToClose} · ${en.tapToClose}`}
        </Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topButton: {
    minHeight: MIN_TARGET - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
  },
  topButtonActive: {
    backgroundColor: colors.primaryTint,
  },
  topButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  bodyFlipped: {
    transform: [{ rotate: '180deg' }],
  },
  bigText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    textAlign: 'center',
  },
  closeHint: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
