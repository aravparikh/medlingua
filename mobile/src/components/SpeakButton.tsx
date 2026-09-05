import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { fontFor, radius, spacing, text, useTheme } from '../theme';
import { MicIcon } from './icons';

interface Props {
  language: Language;
  disabled: boolean;
  fill: string;
  fillPressed: string;
  /** Text/icon colour on `fill`. Defaults to the scheme's onAccent. */
  onFill?: string;
  /** Fires on touch-down so recording starts the instant the finger lands. */
  onStart: () => void;
}

/**
 * One of the two big speak buttons. Labelled ONCE, in its own speaker's
 * language — the clinician's says "Speak English", the patient's is in the
 * patient's script. Nobody needs to read the other one's button.
 */
export function SpeakButton({ language, disabled, fill, fillPressed, onFill, onStart }: Props) {
  const { colors } = useTheme();
  const strings = t(language.code);
  const ink = onFill ?? colors.onAccent;

  return (
    <Pressable
      onPressIn={onStart}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={language.speakLabel}
      accessibilityHint={strings.holdAndSpeak}
      accessibilityState={{ disabled }}
      accessibilityLanguage={language.speechTag}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? fillPressed : fill }, disabled && styles.disabled]}
    >
      <MicIcon size={28} color={ink} />
      <Text
        style={[text.title, fontFor(language.code, 'semibold'), { color: ink }, styles.label]}
        allowFontScaling
        maxFontSizeMultiplier={1.3}
      >
        {language.speakLabel}
      </Text>
    </Pressable>
  );
}

interface AutoProps {
  otherLanguage: Language;
  disabled: boolean;
  onStart: () => void;
}

/** Auto-detect: either person taps it, so it carries both languages — patient first. */
export function AutoSpeakButton({ otherLanguage, disabled, onStart }: AutoProps) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <Pressable
      onPressIn={onStart}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${other.speakAuto}. ${en.speakAuto}`}
      accessibilityHint={`${other.holdAndSpeak}. ${en.holdAndSpeak}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.accent },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <MicIcon size={28} color={colors.onAccent} />
      <View style={styles.stack}>
        <Text
          style={[text.title, fontFor(otherLanguage.code, 'semibold'), { color: colors.onAccent }, styles.label]}
          accessibilityLanguage={otherLanguage.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={1.3}
        >
          {other.speakAuto}
        </Text>
        <Text style={[text.caption, fontFor('en'), { color: colors.onAccent }, styles.secondary]} allowFontScaling maxFontSizeMultiplier={1.3}>
          {en.speakAuto}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    // NOT flex:1 — see PressableScale for the Yoga zero-height bug on device.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minHeight: 132,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stack: { alignItems: 'center', gap: spacing.xxs },
  label: { textAlign: 'center' },
  secondary: { opacity: 0.8, textAlign: 'center' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
});
