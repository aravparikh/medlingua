import { StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { bilingual, fontFor, spacing, text, useTheme } from '../../theme';
import { LevelMeter } from '../LevelMeter';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';

interface Props {
  /** Who is speaking; null in auto-detect mode. */
  speaker: Language | null;
  otherLanguage: Language;
  elapsedMs: number;
  level: number | null;
  tooQuiet: boolean;
  onDone: () => void;
  onCancel: () => void;
}

const formatElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * While recording, the bottom of the screen is one thing: a microphone.
 * A still red dot (recording), a tabular timer, the live meter, and one
 * large Done. Nothing pulses — the meter moving IS the feedback.
 */
export function RecordingPanel({ speaker, otherLanguage, elapsedMs, level, tooQuiet, onDone, onCancel }: Props) {
  const { colors } = useTheme();
  const en = t('en');
  const other = t(otherLanguage.code);
  const rec = speaker ? t(speaker.code) : other;
  const lang = speaker?.code ?? otherLanguage.code;
  const speechTag = speaker?.speechTag ?? otherLanguage.speechTag;

  return (
    <View style={styles.panel}>
      <View style={styles.status} accessibilityLiveRegion="polite">
        <View style={[styles.dot, { backgroundColor: colors.danger }]} importantForAccessibility="no" />
        <Text style={[text.heading, fontFor('en', 'semibold'), styles.timer, { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.3}>
          {formatElapsed(elapsedMs)}
        </Text>
        <Label
          primary={rec.listening}
          secondary={speaker ? undefined : en.listening}
          lang={lang}
          speechTag={speechTag}
          size="body"
          tone="ink2"
          numberOfLines={1}
        />
      </View>

      <LevelMeter level={level} />

      {/* Fixed-height slot so the nudge never shifts the Done button. */}
      <View style={styles.nudgeSlot} accessibilityLiveRegion="polite">
        {tooQuiet ? (
          <Label
            {...bilingual(rec.speakLouder, en.speakLouder)}
            lang={lang}
            speechTag={speechTag}
            tone="danger"
            weight="semibold"
            align="center"
          />
        ) : null}
      </View>

      <Button
        label={bilingual(rec.doneLabel, en.doneLabel)}
        lang={lang}
        speechTag={speechTag}
        variant="accent"
        size="primary"
        onPress={onDone}
        accessibilityHint={`${rec.tapWhenDone}. ${en.tapWhenDone}`}
      />
      <Button label={bilingual(rec.cancel, en.cancel)} lang={lang} speechTag={speechTag} variant="quiet" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.sm, paddingBottom: spacing.sm },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  timer: { fontVariant: ['tabular-nums'] },
  nudgeSlot: { minHeight: 44, justifyContent: 'center' },
});
