import { StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import {
  bloom,
  elevation,
  fontFor,
  ghost,
  radius,
  serifFor,
  spacing,
  tapTarget,
  text,
  useTheme,
  type ColorTokens,
} from '../../theme';
import { CloseIcon } from '../icons';
import { LevelMeter } from '../LevelMeter';
import { Label } from '../ui/Label';
import { PressableScale } from '../PressableScale';

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
 * The recording state, sitting on top of the speaking bloom.
 *
 * The bottom of the screen becomes one thing: a small-caps status line, the
 * elapsed time in the display serif, the live meter, and a single dark pill to
 * finish. Discard is a quiet circle on pale peach beside it — reachable, but
 * never competing with the action almost everyone wants.
 *
 * Nothing here pulses. The meter moves because the microphone is hearing
 * someone and the bloom breathes behind it; a third animation would be
 * decoration on top of two things already saying the same thing.
 */
export function RecordingPanel({ speaker, otherLanguage, elapsedMs, level, tooQuiet, onDone, onCancel }: Props) {
  const { scheme, colors } = useTheme();
  const s = styles(colors, bloom[scheme].control);
  const en = t('en');
  const other = t(otherLanguage.code);
  const rec = speaker ? t(speaker.code) : other;
  const lang = speaker?.code ?? otherLanguage.code;
  const speechTag = speaker?.speechTag ?? otherLanguage.speechTag;

  return (
    <View style={s.panel}>
      <View style={s.status} accessibilityLiveRegion="polite">
        <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {rec.listening}
        </Text>
        <Text style={[text.focal, serifFor('en'), s.timer, { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.3}>
          {formatElapsed(elapsedMs)}
        </Text>
      </View>

      <LevelMeter level={level} />

      {/* Fixed-height slot so the nudge never shifts the controls. */}
      <View style={s.nudgeSlot} accessibilityLiveRegion="polite">
        {tooQuiet ? (
          <Label
            primary={rec.speakLouder}
            secondary={rec.speakLouder === en.speakLouder ? undefined : en.speakLouder}
            lang={lang}
            speechTag={speechTag}
            size="caption"
            tone="danger"
            weight="semibold"
            align="center"
          />
        ) : null}
      </View>

      <View style={s.controls}>
        {/* Discard: quiet, offset, never where a thumb lands by accident. */}
        <PressableScale
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={rec.cancel === en.cancel ? en.cancel : `${rec.cancel}. ${en.cancel}`}
          style={s.discard}
        >
          <CloseIcon size={20} color={colors.ink} />
        </PressableScale>

        <PressableScale
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={rec.doneLabel === en.doneLabel ? en.doneLabel : `${rec.doneLabel}. ${en.doneLabel}`}
          accessibilityHint={`${rec.tapWhenDone}. ${en.tapWhenDone}`}
          flexFill
          style={s.done}
        >
          <Text style={[text.title, fontFor(lang, 'semibold'), { color: colors.bg }]} allowFontScaling maxFontSizeMultiplier={1.3}>
            {rec.doneLabel}
          </Text>
          {rec.doneLabel !== en.doneLabel ? (
            <Text style={[text.caption, fontFor('en'), s.doneEn, { color: colors.bg }]} allowFontScaling maxFontSizeMultiplier={1.3}>
              {en.doneLabel}
            </Text>
          ) : null}
        </PressableScale>
      </View>
    </View>
  );
}

const styles = (c: ColorTokens, peach: string) =>
  StyleSheet.create({
    panel: { gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' },
    status: { alignItems: 'center', gap: spacing.xxs },
    timer: { fontVariant: ['tabular-nums'] },
    nudgeSlot: { minHeight: 40, justifyContent: 'center' },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
    discard: {
      width: ghost.size,
      height: ghost.size,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: peach,
    },
    done: {
      minHeight: tapTarget.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      backgroundColor: c.ink,
      paddingHorizontal: spacing.lg,
      ...elevation.cta,
    },
    doneEn: { opacity: 0.75 },
  });
