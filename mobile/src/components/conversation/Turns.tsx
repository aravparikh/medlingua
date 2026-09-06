import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import type { Phase, Turn } from '../../screens/ConversationScreen';
import { bilingual, fontFor, radius, ROLE_EDGE_WIDTH, roles, serifFor, spacing, tapTarget, text, useTheme } from '../../theme';
import { AlertCircleIcon, ExpandIcon, MoreIcon, SpeakingArc, TrashIcon } from '../icons';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { highlightFlagged } from './flagged';

/** Which side of the counter a turn came from. Clinician speaks English. */
export function roleOf(turn: Turn): keyof typeof roles {
  return turn.speaker.code === 'en' ? 'clinician' : 'patient';
}

/** VoiceOver text for a bilingual pair: both lines, or one when they match. */
function spoken(primary: string, secondary: string): string {
  const label = bilingual(primary, secondary);
  return label.secondary ? `${label.primary}. ${label.secondary}` : label.primary;
}

/** Short enough to be read from standing height; longer text steps down one size. */
const DISPLAY_MAX_CHARS = 60;

interface DeleteProps {
  turn: Turn;
  confirming: boolean;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Delete: a quiet 48pt trash; confirm in place, no modal. */
function DeleteControl({ turn, confirming, onRequest, onCancel, onConfirm }: DeleteProps) {
  const { colors } = useTheme();
  const en = t('en');
  const s = t(turn.speaker.code);
  if (confirming) {
    return (
      <View style={styles.confirm} accessibilityLiveRegion="polite">
        <Label {...bilingual(s.deleteConfirm, en.deleteConfirm)} lang={turn.speaker.code} speechTag={turn.speaker.speechTag} size="caption" tone="ink2" />
        <View style={styles.actions}>
          <Button label={bilingual(s.cancel, en.cancel)} lang={turn.speaker.code} speechTag={turn.speaker.speechTag} variant="outline" flex onPress={onCancel} />
          <Button label={bilingual(s.deleteLabel, en.deleteLabel)} lang={turn.speaker.code} speechTag={turn.speaker.speechTag} variant="danger" flex icon={<TrashIcon size={18} color={colors.danger} />} onPress={onConfirm} />
        </View>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onRequest}
      accessibilityRole="button"
      accessibilityLabel={spoken(s.deleteLabel, en.deleteLabel)}
      style={({ pressed }) => [styles.trash, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      <TrashIcon size={18} color={colors.ink2} />
    </Pressable>
  );
}

interface LedgerRowProps extends DeleteProps {
  onFullscreen: () => void;
}

/** A past turn: one quiet row in the ledger. Role edge, original, translation. */
export function LedgerRow({ turn, confirming, onRequest, onCancel, onConfirm, onFullscreen }: LedgerRowProps) {
  const { colors } = useTheme();
  const en = t('en');
  const edge = colors[roles[roleOf(turn)].edge];
  return (
    <View style={[styles.row, { borderLeftColor: edge, borderBottomColor: colors.rule }]}>
      <Pressable
        onPress={onFullscreen}
        accessibilityRole="button"
        accessibilityLabel={spoken(t(turn.listener.code).fullscreen, en.fullscreen)}
        style={({ pressed }) => [styles.rowBody, pressed && { opacity: 0.7 }]}
      >
        {turn.original ? (
          <Text style={[text.caption, fontFor(turn.speaker.code), { color: colors.ink2 }]} accessibilityLanguage={turn.speaker.speechTag} allowFontScaling maxFontSizeMultiplier={2}>
            {turn.original}
          </Text>
        ) : null}
        <Text style={[text.body, fontFor(turn.listener.code), { color: colors.ink }]} accessibilityLanguage={turn.listener.speechTag} allowFontScaling maxFontSizeMultiplier={2}>
          {turn.translation}
        </Text>
      </Pressable>
      <DeleteControl turn={turn} confirming={confirming} onRequest={onRequest} onCancel={onCancel} onConfirm={onConfirm} />
    </View>
  );
}

interface LiveProps extends DeleteProps {
  otherLanguage: Language;
  phase: Phase;
  flipped: boolean;
  offline: boolean;
  /** Opens the options sheet holding replay, slow replay, show and check. */
  onMore: () => void;
  onFullscreen: () => void;
}

/**
 * THE live line — the one bold thing. The latest translation, set large in
 * the reader's own script, with what was said above it in the speaker's.
 * Whose turn it is, is whose script is in the big type.
 */
export function LiveLine({ turn, otherLanguage, phase, flipped, offline, confirming, onRequest, onCancel, onConfirm, onMore, onFullscreen }: LiveProps) {
  const { colors } = useTheme();
  const en = t('en');
  const listener = t(turn.listener.code);
  const other = t(otherLanguage.code);
  const edge = colors[roles[roleOf(turn)].edge];
  const size = turn.translation.length <= DISPLAY_MAX_CHARS ? 'focal' : 'heading';
  const busy = phase !== 'idle';
  const speaking = phase === 'speaking';
  const fromClinician = turn.speaker.code === 'en';

  return (
    <View style={[styles.live, { borderLeftColor: edge }]}>
      {turn.original ? (
        <Text style={[text.body, fontFor(turn.speaker.code), { color: colors.ink2 }]} accessibilityLanguage={turn.speaker.speechTag} allowFontScaling maxFontSizeMultiplier={2}>
          {highlightFlagged(turn.original, turn.verdict === 'caution' ? turn.flaggedTerms : undefined, [fontFor(turn.speaker.code, 'bold'), { color: colors.caution, textDecorationLine: 'underline' }])}
        </Text>
      ) : null}

      {turn.verdict === 'caution' ? (
        <View style={styles.caution}>
          <AlertCircleIcon size={16} color={colors.caution} />
          <Label {...bilingual(listener.gateCaution, en.gateCaution)} lang={turn.listener.code} speechTag={turn.listener.speechTag} size="caption" tone="caution" weight="semibold" />
        </View>
      ) : null}

      <Pressable
        onPress={onFullscreen}
        accessibilityRole="button"
        accessibilityLabel={spoken(listener.fullscreen, en.fullscreen)}
        style={({ pressed }) => [styles.liveText, flipped && styles.flipped, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.liveHead}>
          <SpeakingArc size={16} color={colors.accent} active={speaking} />
          <ExpandIcon size={16} color={colors.ink2} importantForAccessibility="no" />
        </View>
        <Text
          style={[text[size], serifFor(turn.listener.code), { color: colors.ink }]}
          accessibilityLanguage={turn.listener.speechTag}
          accessibilityLiveRegion="polite"
          allowFontScaling
          maxFontSizeMultiplier={1.4}
        >
          {turn.translation}
        </Text>
      </Pressable>

      {confirming ? (
        <DeleteControl turn={turn} confirming onRequest={onRequest} onCancel={onCancel} onConfirm={onConfirm} />
      ) : (
        <View style={styles.actions}>
          {/* One button, not five. Replay, slow replay, show and check all
             live behind it: at four index rows plus the history block there
             is no vertical room left to spend on a control panel, and the
             live line is meant to be the sentence. */}
          <Button
            label={bilingual(other.moreOptions, en.moreOptions)}
            lang={otherLanguage.code}
            speechTag={otherLanguage.speechTag}
            variant="outline"
            dense
            flex
            icon={<MoreIcon size={20} color={colors.ink} />}
            onPress={onMore}
          />
          <DeleteControl turn={turn} confirming={false} onRequest={onRequest} onCancel={onCancel} onConfirm={onConfirm} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: ROLE_EDGE_WIDTH,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowBody: { flex: 1, gap: spacing.xxs },
  trash: { width: tapTarget.min, height: tapTarget.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  confirm: { gap: spacing.xs, flex: 1 },
  live: { borderLeftWidth: ROLE_EDGE_WIDTH, paddingLeft: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  caution: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveText: { gap: spacing.xs },
  liveHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flipped: { transform: [{ rotate: '180deg' }] },
  actionStack: { gap: spacing.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
