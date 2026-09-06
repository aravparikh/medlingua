import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import type { Turn } from '../../screens/ConversationScreen';
import { fontFor, mono, serifFor, useTheme, type ColorTokens } from '../../theme';
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
  /** Transcript only: opens this turn's options (replay, slow, show, check). */
  onPress?: () => void;
}

/** One exchange: timestamp margin, speaker rule, source over translation. */
function Exchange({ turn, otherLanguage, wide = false, dimmed = false, tinted = false, onPress }: ExchangeProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const clinician = isClinician(turn);
  const tag = clinician ? t(otherLanguage.code).clinicianTag : t(otherLanguage.code).patientTag;

  const en = t('en');
  const other = t(otherLanguage.code);
  // On the transcript every row is a control: tapping it opens that turn's
  // options, which is where the four actions live now that the home screen
  // has no room for them.
  const Row = onPress ? Pressable : View;

  return (
    <Row
      style={({ pressed }: { pressed?: boolean } = {}) => [
        s.exchange,
        wide && s.exchangeWide,
        tinted && s.tinted,
        dimmed && s.dimmed,
        pressed && s.pressed,
      ]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${other.moreOptions}. ${en.moreOptions}` : undefined}
    >
      <View style={[s.margin, wide && s.marginWide]}>
        <Text style={[s.clock, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {clockOf(turn)}
        </Text>
        {wide ? (
          <Text
            style={[
              { fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 },
              fontFor('en', 'semibold'),
              { color: clinician ? colors.ctaFill : colors.ink },
            ]}
            allowFontScaling
            maxFontSizeMultiplier={1.4}
          >
            {tag}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          s.body,
          { borderLeftColor: clinician ? colors.accent : colors.border },
        ]}
      >
        {turn.original ? (
          <Text
            style={[wide ? s.sourceWide : s.source, serifFor(turn.speaker.code), { color: colors.ink }]}
            accessibilityLanguage={turn.speaker.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.8}
          >
            {turn.original}
          </Text>
        ) : null}
        <Text
          style={[wide ? s.glossWide : s.gloss, fontFor(turn.listener.code), { color: colors.ink2 }]}
          accessibilityLanguage={turn.listener.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={1.8}
        >
          {turn.translation}
        </Text>
      </View>
    </Row>
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
      style={({ pressed }) => [s.block, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }, pressed && s.pressed]}
    >
      <View style={s.blockLabel}>
        <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.5 }, fontFor('en', 'semibold'), { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {other.conversationLabel.toUpperCase()}
        </Text>
        <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ctaFill }]} allowFontScaling maxFontSizeMultiplier={1.4}>
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
        <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {other.viewTranscript.toUpperCase()}
        </Text>
        <ChevronForwardIcon size={12} color={colors.ink} />
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
  /** Tapping a row opens that turn's options. */
  onTurnOptions: (turn: Turn) => void;
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
  onTurnOptions,
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
            <ChevronForwardIcon size={12} color={colors.ink} />
          </View>
          <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
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
        <Text style={[s.count, { color: colors.ink2 }]} allowFontScaling maxFontSizeMultiplier={1.4}>
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
            onPress={() => onTurnOptions(turn)}
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
            <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.danger }]} allowFontScaling maxFontSizeMultiplier={1.4}>
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
              <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
                {other.summary.toUpperCase()}
              </Text>
            </Pressable>
            <Pressable
              onPress={onRequestClear}
              accessibilityRole="button"
              accessibilityLabel={`${other.clearAll}. ${en.clearAll}`}
              style={({ pressed }) => [s.footerButton, { borderColor: colors.border }, pressed && s.pressed]}
            >
              <Text style={[{ fontSize: 9.5, lineHeight: 13, letterSpacing: 1.3 }, fontFor('en', 'semibold'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={1.4}>
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
    exchange: { flexDirection: 'row', gap: 8 },
    exchangeWide: { paddingHorizontal: 22, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.rule },
    tinted: { backgroundColor: c.surface },
    dimmed: { opacity: 0.58 },
    margin: { width: 34 },
    marginWide: { width: 62, gap: 3 },
    clock: { textAlign: 'left', fontFamily: mono, fontWeight: '500', fontSize: 10, letterSpacing: 0.3, paddingTop: 4 },
    body: { flex: 1, minWidth: 0, borderLeftWidth: 2, paddingLeft: 12, gap: 3 },
    source: { fontSize: 16, lineHeight: 22.4 },
    gloss: { fontSize: 12, lineHeight: 17.4 },
    sourceWide: { fontSize: 17, lineHeight: 23.8 },
    glossWide: { fontSize: 12.5, lineHeight: 18.1 },

    // The flexible element on the home screen: full-bleed surface that takes
    // the slack. Never a fixed-height scroller here.
    block: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      width: '100%',
      paddingTop: 5,
      paddingHorizontal: 22,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    blockLabel: { flexGrow: 0, flexShrink: 0, flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, marginBottom: 10 },
    // flex:1 + minHeight:0 + hidden — all three, or the bottom-aligned column
    // grows upward through the label instead of clipping.
    exchanges: { flex: 1, minHeight: 0, overflow: 'hidden', justifyContent: 'flex-end', gap: 12 },
    blockFooter: {
      flexGrow: 0,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
    },

    screen: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    // Equal flex on both sides, so the title sits on the screen's centre
    // rather than on the centre of whatever is left over.
    back: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48 },
    backChevron: { transform: [{ rotate: '180deg' }] },
    title: { flex: 1, fontSize: 17, lineHeight: 22, textAlign: 'center' },
    count: { flex: 1, textAlign: 'right', fontFamily: mono, fontWeight: '500', fontSize: 10 },
    ledger: { flex: 1, minHeight: 0 },
    ledgerContent: { paddingBottom: 16 },
    footer: { flexDirection: 'row', gap: 9, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
    footerButton: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 4,
      padding: 12,
    },
    pressed: { backgroundColor: 'rgba(29, 28, 26, 0.04)' },
    disabled: { opacity: 0.4 },
  });
