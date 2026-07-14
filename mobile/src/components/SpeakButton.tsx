import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { colors, displayFontFor, fonts, radius, shadows, spacing, type } from '../theme';
import { PressableScale } from './PressableScale';

interface Props {
  language: Language;
  disabled: boolean;
  fill: string;
  fillPressed: string;
  /** Fires on touch-down so recording starts the instant the finger lands. */
  onStart: () => void;
}

/**
 * One of the two big per-language speak buttons. A single tap starts
 * recording — the conversation screen then swaps the whole bottom area for the
 * recording panel (live level meter + a giant Done button), so there is no
 * hold gesture to maintain and no precision required to stop.
 */
export function SpeakButton({ language, disabled, fill, fillPressed, onStart }: Props) {
  const strings = t(language.code);

  return (
    <PressableScale
      onPressIn={onStart}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={language.speakLabel}
      accessibilityHint={strings.holdAndSpeak}
      accessibilityState={{ disabled }}
      accessibilityLanguage={language.speechTag}
      flexFill
      style={[styles.outer, disabled && styles.dimmed]}
    >
      {({ pressed }) => (
        <View style={[styles.inner, { backgroundColor: pressed ? fillPressed : fill }]}>
          <View style={styles.iconCircle} importantForAccessibility="no">
            <Ionicons name="mic" size={26} color={colors.onPrimary} />
          </View>
          <Text
            style={[styles.label, { fontFamily: displayFontFor(language.code) }]}
            allowFontScaling
            maxFontSizeMultiplier={1.3}
          >
            {language.speakLabel}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

interface AutoProps {
  otherLanguage: Language;
  disabled: boolean;
  onStart: () => void;
}

/**
 * The single speak button for auto-detect mode: either person taps it and
 * Whisper works out which language was spoken, so it is labeled in both.
 */
export function AutoSpeakButton({ otherLanguage, disabled, onStart }: AutoProps) {
  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <PressableScale
      onPressIn={onStart}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${other.speakAuto} — ${en.speakAuto}`}
      accessibilityHint={`${other.holdAndSpeak} — ${en.holdAndSpeak}`}
      accessibilityState={{ disabled }}
      flexFill
      style={[styles.outer, disabled && styles.dimmed]}
    >
      {({ pressed }) => (
        <View
          style={[styles.inner, { backgroundColor: pressed ? colors.primaryPressed : colors.primary }]}
        >
          <View style={styles.iconCircle} importantForAccessibility="no">
            <Ionicons name="mic" size={26} color={colors.onPrimary} />
          </View>
          <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={1.3}>
            {other.speakAuto} · {en.speakAuto}
          </Text>
          <View style={styles.autoBadge} importantForAccessibility="no">
            <Ionicons name="sparkles" size={13} color={colors.onPrimary} />
            <Text style={styles.autoBadgeText} allowFontScaling maxFontSizeMultiplier={1.3}>
              {otherLanguage.nativeName} · English
            </Text>
          </View>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  dimmed: {
    opacity: 0.4,
  },
  inner: {
    minHeight: 148,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.onPrimaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.onPrimary,
    fontFamily: fonts.displayMedium,
    fontSize: type.button,
    textAlign: 'center',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.onPrimaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  autoBadgeText: {
    color: colors.onPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
  },
});
