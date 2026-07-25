import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { AlertCircleIcon, BrandGlyph, CloseIcon, DocumentIcon, ShareIcon, TimeIcon } from './icons';

import type { Language } from '../config/languages';
import { t } from '../i18n/strings';
import { colors, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';
import { PressableScale } from './PressableScale';
import { SkeletonBar } from './Skeleton';

const LIFETIME_S = 120;
const WARN_AT_S = 30;

export type SummaryState =
  | { status: 'loading' }
  | { status: 'ready'; text: string }
  | { status: 'error' };

interface Props {
  /** null = closed. */
  state: SummaryState | null;
  otherLanguage: Language;
  onClose: () => void;
}

/**
 * The ephemeral visit summary. Deliberately self-destructing: a visible 2:00
 * countdown, then the text is gone — the patient copies or shares it to a
 * place THEY choose, and MedLingua keeps its "nothing is saved" promise.
 */
export function SummaryModal({ state, otherLanguage, onClose }: Props) {
  const en = t('en');
  const other = t(otherLanguage.code);

  const [secondsLeft, setSecondsLeft] = useState(LIFETIME_S);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ready = state?.status === 'ready';

  // The countdown starts the moment the summary is readable and never pauses.
  useEffect(() => {
    if (!ready) return;
    setSecondsLeft(LIFETIME_S);
    setCopied(false);
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [ready]);

  // Expiry closes the modal, which clears the summary from state upstream.
  useEffect(() => {
    if (ready && secondsLeft <= 0) onClose();
  }, [ready, secondsLeft, onClose]);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  if (!state) return null;

  const warn = secondsLeft <= WARN_AT_S;
  const mm = Math.floor(Math.max(secondsLeft, 0) / 60);
  const ss = String(Math.max(secondsLeft, 0) % 60).padStart(2, '0');

  const copyAll = async () => {
    if (state.status !== 'ready') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(state.text);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const shareAll = async () => {
    if (state.status !== 'ready') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: state.text });
    } catch {
      // The user backed out of the share sheet — nothing to do.
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.dismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`${other.close} — ${en.close}`}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} importantForAccessibility="no" />
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <DocumentIcon  size={24} color={colors.primary} />
              <View style={styles.titleWrap}>
                <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header" accessibilityLanguage={otherLanguage.speechTag}>
                  {other.summary}
                </Text>
                <Text style={styles.titleEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.summary}</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={`${other.close} — ${en.close}`}
              style={({ pressed }) => [styles.close, pressed && styles.pressedDim]}
            >
              <CloseIcon  size={22} color={colors.primary} />
              <Text style={styles.closeText} allowFontScaling maxFontSizeMultiplier={1.3}>
                {other.close} · {en.close}
              </Text>
            </Pressable>
          </View>

          {state.status === 'loading' ? (
            <View style={styles.loading} accessibilityLiveRegion="polite">
              <SkeletonBar width="62%" height={16} />
              <SkeletonBar width="88%" height={16} />
              <SkeletonBar width="74%" height={16} />
              <Text style={styles.loadingText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                {other.generatingSummary}
              </Text>
              <Text style={styles.loadingTextEn} allowFontScaling maxFontSizeMultiplier={2}>{en.generatingSummary}</Text>
            </View>
          ) : null}

          {state.status === 'error' ? (
            <View style={styles.loading} accessibilityLiveRegion="assertive">
              <AlertCircleIcon  size={30} color={colors.dangerText} />
              <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                {other.connectionError}
              </Text>
              <Text style={styles.loadingTextEn} allowFontScaling maxFontSizeMultiplier={2}>{en.connectionError}</Text>
            </View>
          ) : null}

          {state.status === 'ready' ? (
            <>
              {/* The self-destruct banner: this is a feature, not a bug. */}
              <View style={[styles.timerBanner, warn && styles.timerBannerWarn]} accessibilityLiveRegion="polite">
                <TimeIcon  size={20} color={warn ? colors.onPrimary : colors.secondary} />
                <View style={styles.timerTextWrap}>
                  <Text style={[styles.timerText, warn && styles.timerTextWarn]} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.summaryEphemeral}
                  </Text>
                  <Text style={[styles.timerTextEn, warn && styles.timerTextWarn]} allowFontScaling maxFontSizeMultiplier={1.3}>{en.summaryEphemeral}</Text>
                </View>
                <Text style={[styles.timerClock, warn && styles.timerTextWarn]} allowFontScaling maxFontSizeMultiplier={1.3}>
                  {mm}:{ss}
                </Text>
              </View>
              <View style={styles.timerTrack} importantForAccessibility="no">
                <View
                  style={[
                    styles.timerFill,
                    warn && styles.timerFillWarn,
                    { width: `${(Math.max(secondsLeft, 0) / LIFETIME_S) * 100}%` },
                  ]}
                />
              </View>

              <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                <Text style={styles.summaryText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                  {state.text}
                </Text>
              </ScrollView>

              <View style={styles.actions}>
                <PressableScale
                  onPress={copyAll}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.copy} — ${en.copy}`}
                  flexFill
                  style={[styles.action, styles.actionPrimary]}
                >
                  <BrandGlyph name={copied ? 'checkmark' : 'copy-outline'} size={22} color={colors.onPrimary} />
                  <View style={styles.actionLabels}>
                    <Text style={styles.actionText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                      {copied ? other.copied : other.copy}
                    </Text>
                    <Text style={styles.actionTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{copied ? en.copied : en.copy}</Text>
                  </View>
                </PressableScale>
                <PressableScale
                  onPress={shareAll}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.share} — ${en.share}`}
                  flexFill
                  style={[styles.action, styles.actionSecondary]}
                >
                  <ShareIcon  size={22} color={colors.onPrimary} />
                  <View style={styles.actionLabels}>
                    <Text style={styles.actionText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                      {other.share}
                    </Text>
                    <Text style={styles.actionTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.share}</Text>
                  </View>
                </PressableScale>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    paddingBottom: spacing.xl,
    ...shadows.floating,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  titleWrap: {
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: type.button,
    color: colors.text,
  },
  titleEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  close: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  closeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  pressedDim: {
    opacity: 0.6,
  },
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  loadingTextEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.dangerText,
    textAlign: 'center',
    lineHeight: type.body * 1.4,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceTintSecondary,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  timerBannerWarn: {
    backgroundColor: colors.listening,
  },
  timerTextWrap: {
    flex: 1,
    gap: spacing.hairline,
  },
  timerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.text,
    lineHeight: type.caption * 1.35,
  },
  timerTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textMuted,
    lineHeight: type.micro * 1.35,
  },
  timerTextWarn: {
    color: colors.onPrimary,
  },
  timerClock: {
    fontFamily: fonts.display,
    fontSize: type.title,
    color: colors.secondary,
    // A countdown must not reflow as digits change — 2:00 → 1:59 was
    // shifting the banner text every second.
    fontVariant: ['tabular-nums'],
  },
  timerTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },
  timerFillWarn: {
    backgroundColor: colors.listening,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryText: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.text,
    lineHeight: type.small * 1.55,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  action: {
    minHeight: MIN_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionSecondary: {
    backgroundColor: colors.secondary,
  },
  actionLabels: {
    alignItems: 'center',
  },
  actionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.onPrimary,
  },
  actionTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.onPrimary,
    opacity: 0.9,
  },
});
