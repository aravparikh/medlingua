import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Language } from '../../config/languages';
import { t } from '../../i18n/strings';
import type { Turn } from '../../screens/ConversationScreen';
import { elevation, fontFor, mono, radius, serifFor, typeCap, useTheme, type ColorTokens } from '../../theme';
import { ArrowForwardIcon, ChevronBackIcon, ChevronForwardIcon, MicIcon, MoreIcon, SpeakIcon } from '../icons';
import { SageBackground } from '../sage/Sage';

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
  /** Plays this turn's translation aloud. */
  onPlay: () => void;
  /** Opens this turn's options (replay, slow, show, rephrase, check). */
  onMore: () => void;
}

/** One transcript card: speaker pill, source, translation, play + more. */
function Exchange({ turn, otherLanguage, onPlay, onMore }: ExchangeProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const clinician = isClinician(turn);
  const pill = clinician ? t(otherLanguage.code).doctorWord : t(otherLanguage.code).patientWord;

  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <View style={[s.exchangeCard, { backgroundColor: colors.white }]}>
      <View style={s.exchangeTop}>
        <View style={[s.speakerPill, { backgroundColor: clinician ? colors.ink : colors.mintLight }]}>
          <Text
            style={[
              { fontSize: 11, lineHeight: 14, letterSpacing: 0.9 },
              fontFor('en', 'semibold'),
              { color: clinician ? colors.white : colors.accentText },
            ]}
            allowFontScaling
            maxFontSizeMultiplier={typeCap.chrome}
          >
            {pill.toUpperCase()}
          </Text>
        </View>
        <Text style={[s.time, { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
          {clockOf(turn)}
        </Text>
      </View>
      {turn.original ? (
        <Text
          style={[s.exchangeSource, serifFor(turn.speaker.code, 'medium'), { color: colors.ink }]}
          accessibilityLanguage={turn.speaker.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={typeCap.content}
        >
          {turn.original}
        </Text>
      ) : null}
      <Text
        style={[s.exchangeGloss, fontFor(turn.listener.code), { color: colors.inkSoft }]}
        accessibilityLanguage={turn.listener.speechTag}
        allowFontScaling
        maxFontSizeMultiplier={typeCap.content}
      >
        {turn.translation}
      </Text>
      <View style={s.exchangeActions}>
        <Pressable
          onPress={onPlay}
          accessibilityRole="button"
          accessibilityLabel={`${t(turn.listener.code).playAgain}. ${en.playAgain}`}
          accessibilityLanguage={turn.listener.speechTag}
          style={({ pressed }) => [s.round34, { backgroundColor: colors.mintLight }, pressed && s.pressed]}
        >
          <SpeakIcon size={16} color={colors.accent} />
        </Pressable>
        <Pressable
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel={`${other.moreOptions}. ${en.moreOptions}`}
          style={({ pressed }) => [s.round34, { backgroundColor: colors.cream }, pressed && s.pressed]}
        >
          <MoreIcon size={16} color={colors.inkSoft} />
        </Pressable>
      </View>
    </View>
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
        <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
          {other.conversationLabel.toUpperCase()}
        </Text>
        <View style={[s.countPill, { backgroundColor: colors.white }]}>
          <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1 }, fontFor('en', 'semibold'), { color: colors.accentText }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {`${turns.length} ${countWord}`.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[s.card, { backgroundColor: colors.white }]}>
        <View style={s.speakerRow}>
          <View style={[s.round28, { backgroundColor: colors.mintLight }]} importantForAccessibility="no">
            {clinician ? <SpeakIcon size={13} color={colors.accent} /> : <MicIcon size={13} color={colors.accent} />}
          </View>
          <Text style={[s.speakerLabel, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {sourceLabel}
          </Text>
          <Text style={[s.time, { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {clockOf(turn)}
          </Text>
        </View>

        {turn.original ? (
          <Text
            style={[s.cardSource, serifFor(turn.speaker.code, 'medium'), { color: colors.ink }]}
            accessibilityLanguage={turn.speaker.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={typeCap.content}
          >
            {turn.original}
          </Text>
        ) : null}

        <View style={[s.divider, { backgroundColor: colors.mintLight }]} />

        <View style={s.speakerRow}>
          <View style={[s.round28, { backgroundColor: colors.ink }]} importantForAccessibility="no">
            <ArrowForwardIcon size={15} color={colors.white} />
          </View>
          <Text style={[s.speakerLabel, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
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
          maxFontSizeMultiplier={typeCap.content}
        >
          {turn.translation}
        </Text>

        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${other.viewTranscript}. ${en.viewTranscript}`}
          style={({ pressed }) => [s.cardFooter, { borderTopColor: colors.mintLight }, pressed && s.pressed]}
        >
          <Text style={[{ fontSize: 13, lineHeight: 18 }, fontFor(otherLanguage.code, 'semibold'), { color: colors.accentText }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
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
  /** The row's more button opens that turn's options. */
  onTurnOptions: (turn: Turn) => void;
  /** The row's play button speaks that turn's translation aloud. */
  onPlayTurn: (turn: Turn) => void;
}

/** The full transcript, pushed over the home screen on a pale sage ground. */
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
  onPlayTurn,
}: ScreenProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const en = t('en');
  const other = t(otherLanguage.code);

  return (
    <SageBackground variant="transcript" blobColor={colors.blobPale} single>
      <View style={s.topRow}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={`${other.back}. ${en.back}`}
          style={({ pressed }) => [s.back, pressed && s.pressed]}
        >
          <ChevronBackIcon size={14} color={colors.inkSoft} />
          <Text style={[{ fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, fontFor('en', 'semibold'), { color: colors.inkSoft }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
            {other.back.toUpperCase()}
          </Text>
        </Pressable>
        <Text
          style={[s.title, serifFor(otherLanguage.code, 'medium'), { color: colors.ink }]}
          accessibilityRole="header"
          accessibilityLanguage={otherLanguage.speechTag}
          allowFontScaling
          maxFontSizeMultiplier={typeCap.chrome}
        >
          {other.transcriptTitle}
        </Text>
        <View style={s.countWrap}>
          <View style={[s.countPill, { backgroundColor: colors.white }]}>
            <Text style={[{ fontSize: 12, lineHeight: 16 }, fontFor('en', 'semibold'), { color: colors.accentText }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
              {turns.length}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.ledger} contentContainerStyle={s.ledgerContent}>
        {turns.map((turn) => (
          <Exchange
            key={turn.id}
            turn={turn}
            otherLanguage={otherLanguage}
            onPlay={() => onPlayTurn(turn)}
            onMore={() => onTurnOptions(turn)}
          />
        ))}
      </ScrollView>

      <View style={s.footer}>
        {confirmingClear ? (
          <Pressable
            onPress={onConfirmClear}
            accessibilityRole="button"
            accessibilityLabel={`${other.clearAllConfirm} ${other.clearAll}`}
            style={({ pressed }) => [s.bottomCard, { backgroundColor: colors.white, borderColor: colors.dangerBorder }, pressed && s.pressed]}
          >
            <Text style={[s.bottomTitle, serifFor(otherLanguage.code, 'medium'), { color: colors.danger }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
              {other.clearAllConfirm}
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
                s.bottomCard,
                { backgroundColor: colors.white },
                pressed && s.pressed,
                summaryDisabled && s.disabled,
              ]}
            >
              <Text style={[s.bottomTitle, serifFor(otherLanguage.code, 'medium'), { color: colors.ink }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
                {other.summary}
              </Text>
              <Text style={[s.bottomSub, fontFor('en', 'semibold'), { color: colors.muted }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
                {en.summary.toUpperCase()}
              </Text>
            </Pressable>
            <Pressable
              onPress={onRequestClear}
              accessibilityRole="button"
              accessibilityLabel={`${other.clearAll}. ${en.clearAll}`}
              style={({ pressed }) => [s.bottomCard, { backgroundColor: colors.white, borderColor: colors.dangerBorder }, pressed && s.pressed]}
            >
              <Text style={[s.bottomTitle, serifFor(otherLanguage.code, 'medium'), { color: colors.danger }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
                {other.clearAll}
              </Text>
              <Text style={[s.bottomSub, fontFor('en', 'semibold'), { color: colors.danger, opacity: 0.75 }]} allowFontScaling maxFontSizeMultiplier={typeCap.chrome}>
                {en.clearAll.toUpperCase()}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SageBackground>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    exchangeCard: {
      borderRadius: radius.card,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 10,
      ...elevation.card,
    },
    exchangeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    speakerPill: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999 },
    exchangeSource: { fontSize: 24, lineHeight: 29 },
    exchangeGloss: { fontSize: 15, lineHeight: 21 },
    exchangeActions: { flexDirection: 'row', gap: 6, marginTop: 2 },
    round34: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

    // Conversation state: a fixed card, never a scroller. The slack lives in
    // the spacer above the speak card instead.
    blockSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 24,
      marginBottom: 12,
    },
    countPill: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
    card: {
      marginHorizontal: 16,
      borderRadius: radius.card,
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 16,
      gap: 14,
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
      paddingHorizontal: 16,
      paddingTop: 4,
      minHeight: 56,
    },
    // Equal flex on both sides, so the title sits on the screen's centre
    // rather than on the centre of whatever is left over.
    back: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 48 },
    title: { flex: 2, fontSize: 26, lineHeight: 30, textAlign: 'center' },
    countWrap: { flex: 1, alignItems: 'flex-end' },
    ledger: { flex: 1, minHeight: 0 },
    ledgerContent: { gap: 10, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
    footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    bottomCard: {
      flex: 1,
      minWidth: 0,
      gap: 2,
      minHeight: 76,
      justifyContent: 'center',
      borderRadius: radius.card,
      borderWidth: 1.5,
      borderColor: 'transparent',
      paddingVertical: 16,
      paddingHorizontal: 20,
      ...elevation.card,
    },
    bottomTitle: { fontSize: 22, lineHeight: 26 },
    bottomSub: { fontSize: 11, lineHeight: 14, letterSpacing: 1 },
    pressed: { opacity: 0.96 },
    disabled: { opacity: 0.4 },
  });
