import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import type { Turn } from '../../screens/ConversationScreen';
import { fontFor, mono, radius, serifFor, spacing, tapTarget, text, useTheme, type ColorTokens } from '../../theme';
import { ChevronForwardIcon } from '../icons';

/**
 * The visit as a ledger.
 *
 * Two views of the same turns: a block on the home screen showing only the
 * last two, and a full screen behind it. Both put the timestamp in a margin
 * column and hang the text off a 2px rule coloured by who spoke, so the
 * speaker is legible before a single word is read.
 *
 * Timestamps come from the turn's own id, which is the millisecond it was
 * created — nothing here is invented for the layout.
 */

const clockOf = (turn: Turn) =>
  new Date(turn.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

/** English is always the clinician's side; the other language is the patient's. */
const isClinician = (turn: Turn) => turn.speaker.code === 'en';

interface ExchangeProps {
  turn: Turn;
  otherLanguage: Language;
  /** Margin width: wider on the full screen, which also carries a speaker tag. */
  wide?: boolean;
  dimmed?: boolean;
  tinted?: boolean;
}

/** One exchange: timestamp margin, speaker rule, source over translation. */
function Exchange({ turn, otherLanguage, wide = false, dimmed = false, tinted = false }: ExchangeProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const clinician = isClinician(turn);
  const tag = clinician ? t(otherLanguage.code).clinicianTag : t(otherLanguage.code).patientTag;

  return (
    <View style={[s.exchange, tinted && s.tinted, dimmed && s.dimmed]}>
      <View style={[s.margin, wide && s.marginWide]}>
        <Text style={[s.clock, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {clockOf(turn)}
        </Text>
        {wide ? (
          <Text
            style={[text.label, fontFor('en', 'semibold'), { color: clinician ? colors.accent : colors.ink2 }]}
            allowFontScaling
            maxFontSizeMultiplier={1.4}
          >
            {tag}
          </Text>
        ) : null}
      </View>
      <View style={[s.body, { borderLeftColor: clinician ? colors.accent : colors.border }]}>
        {turn.original ? (
          <Text
            style={[s.source, serifFor(turn.speaker.code), { color: colors.ink }]}
            accessibilityLanguage={turn.speaker.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.8}
          >
            {turn.original}
          </Text>
        ) : null}
        <Text
          style={[s.gloss, fontFor(turn.listener.code), { color: colors.ink2 }]}
          accessibilityLanguage={turn.listener.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={1.8}
        >
          {turn.translation}
        </Text>
      </View>
    </View>
  );
}

interface BlockProps {
  turns: Turn[];
  otherLanguage: Language;
  onOpen: () => void;
}

/**
 * The home screen's conversation block: the last two exchanges, growing up
 * from the bottom so new speech pushes old speech out of view rather than
 * scrolling. One summary of the visit that opens the whole thing.
 */
export function ConversationBlock({ turns, otherLanguage, onOpen }: BlockProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(otherLanguage.code);
  const recent = turns.slice(-2);

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${other.viewTranscript}. ${en.viewTranscript}`}
      style={({ pressed }) => [s.block, { borderBottomColor: colors.hairline }, pressed && s.pressed]}
    >
      <View style={s.blockLabel}>
        <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {other.conversationLabel.toUpperCase()}
        </Text>
        <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.accent }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {`${turns.length} ${other.exchanges}`.toUpperCase()}
        </Text>
      </View>

      {/* Clipped and bottom-aligned: without the clip a bottom-aligned column
         overflows upward and collides with the label as soon as text wraps. */}
      <View style={s.exchanges}>
        {recent.map((turn, i) => (
          <Exchange
            key={turn.id}
            turn={turn}
            otherLanguage={otherLanguage}
            dimmed={recent.length > 1 && i === 0}
          />
        ))}
      </View>

      <View style={[s.blockFooter, { borderTopColor: colors.rule }]}>
        <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {other.viewTranscript.toUpperCase()}
        </Text>
        <ChevronForwardIcon size={14} color={colors.ink} />
      </View>
    </Pressable>
  );
}

interface ScreenProps {
  turns: Turn[];
  otherLanguage: Language;
  /** Disabled while offline or busy — the summary needs the network. */
  summaryDisabled: boolean;
  confirmingClear: boolean;
  onBack: () => void;
  onSummary: () => void;
  onRequestClear: () => void;
  onConfirmClear: () => void;
}

/** The full transcript, pushed over the home screen. */
export function TranscriptScreen({
  turns,
  otherLanguage,
  summaryDisabled,
  confirmingClear,
  onBack,
  onSummary,
  onRequestClear,
  onConfirmClear,
}: ScreenProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <View style={[s.topRow, { borderBottomColor: colors.hairline }]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={`${other.back}. ${en.back}`}
          style={({ pressed }) => [s.back, pressed && s.pressed]}
        >
          <View style={s.backChevron}>
            <ChevronForwardIcon size={16} color={colors.ink} />
          </View>
          <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {other.back.toUpperCase()}
          </Text>
        </Pressable>
        <Text
          style={[s.title, serifFor(otherLanguage.code), { color: colors.ink }]}
          accessibilityRole="header"
          accessibilityLanguage={otherLanguage.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={1.5}
        >
          {other.transcriptTitle}
        </Text>
        <Text style={[s.clock, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {turns.length}
        </Text>
      </View>

      <ScrollView style={s.ledger} contentContainerStyle={s.ledgerContent}>
        {turns.map((turn, i) => (
          <Exchange
            key={turn.id}
            turn={turn}
            otherLanguage={otherLanguage}
            wide
            tinted={i === turns.length - 1}
          />
        ))}
      </ScrollView>

      <View style={[s.footer, { borderTopColor: colors.hairline }]}>
        {confirmingClear ? (
          <Pressable
            onPress={onConfirmClear}
            accessibilityRole="button"
            accessibilityLabel={`${other.clearAllConfirm} ${other.clearAll}`}
            style={({ pressed }) => [s.footerButton, { borderColor: colors.danger }, pressed && s.pressed]}
          >
            <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.danger }]} allowFontScaling maxFontSizeMultiplier={1.4}>
              {other.clearAllConfirm.toUpperCase()}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={onSummary}
              disabled={summaryDisabled}
              accessibilityRole="button"
              accessibilityLabel={`${other.summary}. ${en.summary}`}
              style={({ pressed }) => [
                s.footerButton,
                { borderColor: colors.border },
                pressed && s.pressed,
                summaryDisabled && s.disabled,
              ]}
            >
              <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
                {other.summary.toUpperCase()}
              </Text>
            </Pressable>
            <Pressable
              onPress={onRequestClear}
              accessibilityRole="button"
              accessibilityLabel={`${other.clearAll}. ${en.clearAll}`}
              style={({ pressed }) => [s.footerButton, { borderColor: colors.border }, pressed && s.pressed]}
            >
              <Text style={[text.label, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
                {other.clearAll.toUpperCase()}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    exchange: { flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs },
    tinted: { backgroundColor: c.surface },
    dimmed: { opacity: 0.58 },
    margin: { width: 38 },
    marginWide: { width: 58, gap: 2 },
    clock: { fontFamily: mono, fontSize: 10.5, letterSpacing: 0.3 },
    body: { flex: 1, borderLeftWidth: 2, paddingLeft: spacing.sm, gap: 3 },
    source: { fontSize: 17, lineHeight: 24 },
    gloss: { fontSize: 12.5, lineHeight: 18 },

    block: { height: 186, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
    blockLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    // flex:1 + minHeight:0 + hidden — all three, or the bottom-aligned column
    // grows upward through the label instead of clipping.
    exchanges: { flex: 1, minHeight: 0, overflow: 'hidden', justifyContent: 'flex-end', gap: spacing.sm },
    blockFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xxs,
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
    },

    screen: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, minHeight: tapTarget.min, minWidth: 72 },
    backChevron: { transform: [{ rotate: '180deg' }] },
    title: { fontSize: 18, lineHeight: 24 },
    ledger: { flex: 1, minHeight: 0 },
    ledgerContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
    footer: { flexDirection: 'row', gap: spacing.xs, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
    footerButton: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 'auto',
      minHeight: tapTarget.min,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 4,
    },
    pressed: { backgroundColor: 'rgba(29, 28, 26, 0.04)' },
    disabled: { opacity: 0.4 },
  });
