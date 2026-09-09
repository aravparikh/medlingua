import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import { fontFor, serifFor, useTheme, type ColorTokens } from '../../theme';
import { Masthead } from '../editorial/Editorial';
import { CheckIcon, CloseIcon } from '../icons';
import { SageBackground } from '../sage/Sage';

interface Props {
  /** Who is speaking; null in auto-detect mode. */
  speaker: Language | null;
  otherLanguage: Language;
  detecting: boolean;
  elapsedMs: number;
  level: number | null;
  tooQuiet: boolean;
  onDone: () => void;
  onCancel: () => void;
  onChangeLanguage: () => void;
  onSettings: () => void;
}

const formatElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Rest heights of the 7 meter bars, tallest in the middle. */
const REST = [28, 40, 52, 64, 52, 40, 28];
/** Per-bar response to live levels, so the meter reads as one shape. */
const RESPONSE = [0.75, 0.85, 0.95, 1, 0.95, 0.85, 0.75];

/**
 * Listening replaces the home content while recording: the header dimmed and
 * frozen, a white organic blob with a 7-bar meter breathing at its center,
 * the elapsed time big in Newsreader, and cancel + done pills pinned to the
 * bottom. Start/stop/cancel and the timer behave exactly as before.
 */
export function RecordingPanel({
  speaker,
  otherLanguage,
  detecting,
  elapsedMs,
  level,
  tooQuiet,
  onDone,
  onCancel,
  onChangeLanguage,
  onSettings,
}: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(otherLanguage.code);
  const rec = speaker ? t(speaker.code) : other;
  const pair = !speaker || speaker.code !== 'en' ? `${otherLanguage.nativeName} → EN` : `EN → ${otherLanguage.nativeName}`;

  const [bars] = useState(() => REST.map(() => new Animated.Value(0.65)));
  const loops = useRef<Animated.CompositeAnimation[]>([]);

  // Idle: each bar breathes scaleY 0.35→1→0.35 on its own 0.9–1.2s loop with
  // an 80ms stagger. Live levels: stop the loops and ease every bar toward
  // its level-driven height instead.
  useEffect(() => {
    loops.current.forEach((loop) => loop.stop());
    loops.current = [];
    if (level == null) {
      bars.forEach((bar, i) => {
        const breathe = Animated.sequence([
          Animated.delay(i * 80),
          Animated.loop(
            Animated.sequence([
              Animated.timing(bar, { toValue: 1, duration: 450 + (i % 3) * 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(bar, { toValue: 0.35, duration: 450 + ((i + 1) % 3) * 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
          ),
        ]);
        loops.current.push(breathe);
        breathe.start();
      });
    } else {
      bars.forEach((bar, i) => {
        Animated.timing(bar, {
          toValue: Math.min(1, 0.35 + 0.65 * level * RESPONSE[i]),
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }
    return () => {
      loops.current.forEach((loop) => loop.stop());
      loops.current = [];
    };
  }, [level, bars]);

  return (
    <SageBackground variant="listening" blobColor={colors.mintLight} single>
      <View style={s.dim} pointerEvents="none">
        <Masthead
          language={otherLanguage}
          detecting={detecting}
          disabled
          quiet
          onChangeLanguage={onChangeLanguage}
          onSettings={onSettings}
        />
      </View>

      <View style={s.center}>
        <View style={s.blob} importantForAccessibility="no">
          <View style={s.blobInner} />
          <View style={s.meter} accessibilityLiveRegion="polite">
            {REST.map((h, i) => (
              <Animated.View
                key={i}
                style={[{ width: 12, height: h, borderRadius: 6, backgroundColor: colors.ink, transform: [{ scaleY: bars[i] }] }]}
              />
            ))}
          </View>
        </View>

        <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.accentText }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {rec.listening.toUpperCase()}
        </Text>
        <Text style={[s.timer, serifFor('en'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.3}>
          {formatElapsed(elapsedMs)}
        </Text>
        <Text style={[{ fontSize: 14, lineHeight: 20 }, fontFor('en'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {`${en.listening.replace(/…|\.\.\./g, '')} · ${pair}`}
        </Text>
        {tooQuiet ? (
          <Text style={[{ fontSize: 14, lineHeight: 20 }, fontFor(speaker?.code ?? otherLanguage.code, 'semibold'), { color: colors.danger }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {rec.speakLouder}
          </Text>
        ) : null}
      </View>

      <View style={s.controls}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCancel();
          }}
          accessibilityRole="button"
          accessibilityLabel={rec.cancel === en.cancel ? en.cancel : `${rec.cancel}. ${en.cancel}`}
          style={({ pressed }) => [s.cancel, { backgroundColor: colors.white }, pressed && s.pressed]}
        >
          <CloseIcon size={22} color={colors.ink} />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDone();
          }}
          accessibilityRole="button"
          accessibilityLabel={rec.doneLabel === en.doneLabel ? en.doneLabel : `${rec.doneLabel}. ${en.doneLabel}`}
          accessibilityHint={`${rec.tapWhenDone}. ${en.tapWhenDone}`}
          style={({ pressed }) => [s.done, { backgroundColor: colors.ink }, pressed && s.pressed]}
        >
          <View style={s.doneText}>
            <Text style={[{ fontSize: 30, lineHeight: 34 }, serifFor(speaker?.code ?? otherLanguage.code, 'medium'), { color: colors.onCta }]} allowFontScaling maxFontSizeMultiplier={1.3}>
              {rec.doneLabel}
            </Text>
            <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.onCta, opacity: 0.65 }]} allowFontScaling maxFontSizeMultiplier={1.3}>
              {en.doneLabel.toUpperCase()}
            </Text>
          </View>
          <View style={[s.check, { backgroundColor: colors.accent }]} importantForAccessibility="no">
            <CheckIcon size={22} color={colors.onCta} />
          </View>
        </Pressable>
      </View>
    </SageBackground>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    dim: { opacity: 0.55 },
    center: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
    blob: {
      width: 240,
      height: 240,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.7)',
      borderTopLeftRadius: 118,
      borderTopRightRadius: 122,
      borderBottomRightRadius: 112,
      borderBottomLeftRadius: 126,
    },
    blobInner: {
      position: 'absolute',
      left: 26,
      right: 26,
      top: 26,
      bottom: 26,
      backgroundColor: c.white,
      borderTopLeftRadius: 100,
      borderTopRightRadius: 88,
      borderBottomRightRadius: 104,
      borderBottomLeftRadius: 92,
    },
    meter: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    timer: { fontSize: 44, lineHeight: 48, fontVariant: ['tabular-nums'] },
    controls: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 40 },
    cancel: {
      width: 64,
      minHeight: 76,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    done: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 76,
      borderRadius: 26,
      paddingVertical: 18,
      paddingHorizontal: 24,
    },
    doneText: { flex: 1, minWidth: 0 },
    check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.92 },
  });
