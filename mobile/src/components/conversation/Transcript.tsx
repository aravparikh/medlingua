import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import type { Turn } from '../../screens/ConversationScreen';
import { elevation, fontFor, mono, serifFor, useTheme, type ColorTokens } from '../../theme';
import { ArrowForwardIcon, ChevronForwardIcon, MicIcon, SpeakIcon } from '../icons';

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
  onPlayTurn: (turn: Turn) => void;
}

/**
 * Home conversation state: the section row with the exchange-count pill,
 * then one white card with the LATEST exchange — speaker row, source in
 * Newsreader, divider, target row with a play button, translation, and a
 * footer that opens the full transcript. The hero returns when empty.
 */
export function ConversationBlock({ turns, otherLanguage, onOpen, onPlayTurn }: BlockProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(otherLanguage.code);
  const turn = turns[turns.length - 1];
  const clinician = isClinician(turn);
  const countWord = turns.length === 1 ? other.exchangeSingular : other.exchanges;
  const sourceLabel = clinician
    ? `${en.youLabel} · ENGLISH`.toUpperCase()
    : `${other.youLabel} · ${otherLanguage.nativeName}`.toUpperCase();
  const targetLabel = clinician
    ? `${other.forYou} · ${otherLanguage.nativeName}`.toUpperCase()
    : `${en.forDoctor} · ENGLISH`.toUpperCase();

  return (
    <View>
      <View style={s.blockSection}>
        <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={1.4}>
          {other.conversationLabel.toUpperCase()}
        </Text>
        <View style={[s.countPill, { backgroundColor: colors.white }]}>
          <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1 }, fontFor('en', 'semibold'), { color: colors.accent }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {`${turns.length} ${countWord}`.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[s.card, { backgroundColor: colors.white }]}>
        <View style={s.speakerRow}>
          <View style={[s.round28, { backgroundColor: colors.mintLight }]} importantForAccessibility="no">
            {clinician ? <SpeakIcon size={13} color={colors.accent} /> : <MicIcon size={13} color={colors.accent} />}
          </View>
          <Text style={[s.speakerLabel, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {sourceLabel}
          </Text>
          <Text style={[s.time, { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {clockOf(turn)}
          </Text>
        </View>

        {turn.original ? (
          <Text
            style={[s.cardSource, serifFor(turn.speaker.code, 'medium'), { color: colors.ink }]}
            accessibilityLanguage={turn.speaker.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.8}
          >
            {turn.original}
          </Text>
        ) : null}

        <View style={[s.divider, { backgroundColor: colors.mintLight }]} />

        <View style={s.speakerRow}>
          <View style={[s.round28, { backgroundColor: colors.ink }]} importantForAccessibility="no">
            <ArrowForwardIcon size={15} color={colors.white} />
          </View>
          <Text style={[s.speakerLabel, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {targetLabel}
          </Text>
          <Pressable
            onPress={() => onPlayTurn(turn)}
            accessibilityRole="button"
            accessibilityLabel={`${t(turn.listener.code).playAgain}. ${en.playAgain}`}
            accessibilityLanguage={turn.listener.speechTag}
            style={({ pressed }) => [s.round28, { backgroundColor: colors.mintLight }, pressed && s.pressed]}
          >
            <SpeakIcon size={15} color={colors.accent} />
          </Pressable>
        </View>

        <Text
          style={[s.cardGloss, fontFor(turn.listener.code), { color: colors.ink }]}
          accessibilityLanguage={turn.listener.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={1.8}
        >
          {turn.translation}
        </Text>

        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${other.viewTranscript}. ${en.viewTranscript}`}
          style={({ pressed }) => [s.cardFooter, { borderTopColor: colors.mintLight }, pressed && s.pressed]}
        >
          <Text style={[{ fontSize: 13, lineHeight: 18 }, fontFor(otherLanguage.code, 'semibold'), { color: colors.accent }]} allowFontScaling maxFontSizeMultiplier={1.4}>
            {other.viewTranscript}
          </Text>
          <View style={[s.chevronCircle, { backgroundColor: colors.cream }]} importantForAccessibility="no">
            <ChevronForwardIcon size={14} color={colors.inkSoft} />
          </View>
        </Pressable>
      </View>
    </View>
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

    // Conversation state: a fixed card, never a scroller. The slack lives in
    // the spacer above the speak card instead.
    blockSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 22,
      marginBottom: 10,
    },
    countPill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
    card: {
      marginHorizontal: 16,
      borderRadius: 26,
      paddingTop: 20,
      paddingHorizontal: 22,
      paddingBottom: 16,
      gap: 12,
      ...elevation.card,
    },
    speakerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    round28: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    speakerLabel: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16, letterSpacing: 1 },
    time: { fontSize: 12, lineHeight: 16, fontFamily: mono, fontVariant: ['tabular-nums'] },
    cardSource: { fontSize: 24, lineHeight: 29 },
    divider: { height: 1.5 },
    cardGloss: { fontSize: 17, lineHeight: 24 },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1.5,
      paddingTop: 6,
      marginTop: 2,
      minHeight: 44,
    },
    chevronCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

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
