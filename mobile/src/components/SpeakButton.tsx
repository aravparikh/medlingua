import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { colors, displayFontFor, fonts, radius, shadows, spacing, type } from '../theme';
import { PressableScale } from './PressableScale';
import { Pulse } from './Pulse';

export type SpeakButtonState = 'idle' | 'listening' | 'disabled';

interface Props {
  language: Language;
  state: SpeakButtonState;
  /** True while recording continues after a quick tap — "tap when finished" mode. */
  awaitingTapToStop: boolean;
  fill: string;
  fillPressed: string;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * One of the two big per-language speak buttons. Forgiving by design:
 * hold-to-talk works (release to finish), and a quick tap also works —
 * recording simply continues and the label switches to "tap when finished".
 */
export function SpeakButton({ language, state, awaitingTapToStop, fill, fillPressed, onPressIn, onPressOut }: Props) {
  const strings = t(language.code);
  const listening = state === 'listening';

  return (
    <PressableScale
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={state === 'disabled'}
      accessibilityRole="button"
      accessibilityLabel={language.speakLabel}
      accessibilityHint={listening ? strings.tapWhenDone : strings.holdAndSpeak}
      accessibilityState={{ disabled: state === 'disabled', busy: listening }}
      accessibilityLanguage={language.speechTag}
      flexFill
      style={[styles.outer, state === 'disabled' && styles.dimmed]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: listening
                ? pressed
                  ? colors.listeningPressed
                  : colors.listening
                : pressed
                  ? fillPressed
                  : fill,
            },
          ]}
        >
          {listening ? (
            <>
              <View style={styles.iconCircle}>
                <Pulse color={colors.onPrimary} size={44} />
              </View>
              <Text
                style={[styles.label, { fontFamily: displayFontFor(language.code) }]}
                allowFontScaling
                maxFontSizeMultiplier={1.5}
              >
                {strings.listening}
              </Text>
              {awaitingTapToStop ? (
                <Text style={styles.sub} allowFontScaling maxFontSizeMultiplier={1.5}>
                  {strings.tapWhenDone}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.iconCircle} importantForAccessibility="no">
                <Ionicons name="mic" size={26} color={colors.onPrimary} />
              </View>
              <Text
                style={[styles.label, { fontFamily: displayFontFor(language.code) }]}
                allowFontScaling
                maxFontSizeMultiplier={1.5}
              >
                {language.flag} {language.speakLabel}
              </Text>
            </>
          )}
        </View>
      )}
    </PressableScale>
  );
}

interface AutoProps {
  otherLanguage: Language;
  state: SpeakButtonState;
  awaitingTapToStop: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

/**
 * The single speak button for auto-detect mode: either person presses it and
 * Whisper works out which language was spoken, so it is labeled in both.
 */
export function AutoSpeakButton({ otherLanguage, state, awaitingTapToStop, onPressIn, onPressOut }: AutoProps) {
  const en = t('en');
  const other = t(otherLanguage.code);
  const listening = state === 'listening';

  return (
    <PressableScale
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={state === 'disabled'}
      accessibilityRole="button"
      accessibilityLabel={`${en.speakAuto} — ${other.speakAuto}`}
      accessibilityHint={listening ? `${other.tapWhenDone} — ${en.tapWhenDone}` : `${other.holdAndSpeak} — ${en.holdAndSpeak}`}
      accessibilityState={{ disabled: state === 'disabled', busy: listening }}
      flexFill
      style={[styles.outer, state === 'disabled' && styles.dimmed]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: listening
                ? pressed
                  ? colors.listeningPressed
                  : colors.listening
                : pressed
                  ? colors.primaryPressed
                  : colors.primary,
            },
          ]}
        >
          {listening ? (
            <>
              <View style={styles.iconCircle}>
                <Pulse color={colors.onPrimary} size={44} />
              </View>
              <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={1.5}>
                {other.listening}
              </Text>
              <Text style={styles.sub} allowFontScaling maxFontSizeMultiplier={1.5}>
                {awaitingTapToStop ? `${other.tapWhenDone} · ${en.tapWhenDone}` : en.listening}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.iconCircle} importantForAccessibility="no">
                <Ionicons name="mic" size={26} color={colors.onPrimary} />
              </View>
              <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={1.5}>
                {en.speakAuto} · {other.speakAuto}
              </Text>
              <View style={styles.autoBadge} importantForAccessibility="no">
                <Ionicons name="sparkles" size={13} color={colors.onPrimary} />
                <Text style={styles.autoBadgeText}>
                  🇺🇸 English · {otherLanguage.flag} {otherLanguage.nativeName}
                </Text>
              </View>
            </>
          )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.onPrimary,
    fontFamily: fonts.displayMedium,
    fontSize: type.button,
    textAlign: 'center',
  },
  sub: {
    color: colors.onPrimary,
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    textAlign: 'center',
    opacity: 0.9,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
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
