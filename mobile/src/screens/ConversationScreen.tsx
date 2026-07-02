import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  createAudioPlayer,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

import { ENGLISH, type Language } from '../config/languages';
import { CLINICIAN_PHRASES, PATIENT_PHRASES, type Phrase } from '../config/phrases';
import { t } from '../i18n/strings';
import { clearSpokenAudio, MissingKeyError, synthesize, transcribe, translate, TranslationError } from '../services/openai';
import { loadPrefs, savePrefs } from '../services/storage';
import { colors, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';
import { Appear } from '../components/Appear';
import { PressableScale } from '../components/PressableScale';
import { TurnSkeleton } from '../components/Skeleton';
import { AutoSpeakButton, SpeakButton } from '../components/SpeakButton';

type Phase = 'idle' | 'listening' | 'translating' | 'speaking';

export interface Turn {
  id: number;
  original: string;
  translation: string;
  speaker: Language;
  listener: Language;
}

interface Props {
  otherLanguage: Language;
  /** The visit's transcript. Held by App so it survives the About screen,
   * but memory-only: cleared on language change and gone when the app closes. */
  turns: Turn[];
  onTurnsChange: (turns: Turn[]) => void;
  onChangeLanguage: () => void;
  onShowAbout: () => void;
}

/** Releasing the button after this long counts as hold-to-talk; a quicker tap
 * keeps recording until the button is tapped again. Forgiving either way. */
const HOLD_THRESHOLD_MS = 700;

/**
 * The conversation screen — where 95% of usage happens. Two big buttons, one
 * per language (or a single auto-detect button); each person holds or taps,
 * speaks, and hears the translation aloud. The running thread makes the
 * back-and-forth visible; nothing is ever written to disk.
 */
export function ConversationScreen({ otherLanguage, turns, onTurnsChange, onChangeLanguage, onShowAbout }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [phase, setPhase] = useState<Phase>('idle');
  const [speaker, setSpeaker] = useState<Language | null>(null);
  const [error, setError] = useState<'didntCatch' | 'connectionError' | 'micPermission' | 'notReady' | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retryCtx, setRetryCtx] = useState<{ uri: string; who: Language | null } | null>(null);
  const [awaitingTap, setAwaitingTap] = useState(false);
  const [autoMode, setAutoMode] = useState(() => loadPrefs().autoMode ?? false);
  const [flipped, setFlipped] = useState(false);
  const [phrasesOpen, setPhrasesOpen] = useState(false);

  const pressStartedAt = useRef(0);
  const startingRef = useRef(false);
  const finishingRef = useRef(false);
  /** Set when the button is released before recording has started (see handlePressOut). */
  const releasedEarlyRef = useRef(false);
  const listeningStartedAtRef = useRef(0);
  const playerRef = useRef<AudioPlayer | null>(null);
  /** Which turn the loaded player belongs to — replay must never play another turn's audio. */
  const playerTurnIdRef = useRef<number | null>(null);
  const ttsUriRef = useRef<string | null>(null);
  const lastPhraseAtRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const en = t('en');
  const other = t(otherLanguage.code);
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  useEffect(() => {
    return () => {
      playerRef.current?.remove();
      Speech.stop();
      clearSpokenAudio();
    };
  }, []);

  const releasePlayer = () => {
    playerRef.current?.remove();
    playerRef.current = null;
    playerTurnIdRef.current = null;
  };

  const stopAllAudio = () => {
    releasePlayer();
    Speech.stop();
    clearSpokenAudio();
    ttsUriRef.current = null;
  };

  const addTurn = (turn: Turn) => {
    onTurnsChange([...turns, turn]);
    setFlipped(false);
  };

  const startListening = async (who: Language | null) => {
    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    setSetupError(null);
    setRetryCtx(null);
    releasedEarlyRef.current = false;
    stopAllAudio();

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('micPermission');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // allowsRecording routes iOS audio to the quiet earpiece, so it is only
      // enabled while actually recording and switched off again for playback.
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      listeningStartedAtRef.current = Date.now();
      setSpeaker(who);
      setPhase('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (releasedEarlyRef.current) {
        // The finger already lifted while we were starting up: behave like a
        // quick tap, so the "tap when finished" hint shows.
        releasedEarlyRef.current = false;
        setAwaitingTap(true);
      }
    } catch {
      setError('connectionError');
      setPhase('idle');
    } finally {
      startingRef.current = false;
    }
  };

  const finishListening = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setAwaitingTap(false);
    setPhase('translating');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      const heldFor = Date.now() - listeningStartedAtRef.current;
      const uri = recorder.uri;
      if (!uri || heldFor < 500) {
        // Too short to contain speech — friendly nudge instead of an API call.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('didntCatch');
        setPhase('idle');
        return;
      }
      await processRecording(uri, speaker);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('connectionError');
      setPhase('idle');
    } finally {
      finishingRef.current = false;
    }
  };

  /** Transcribe → translate → speak. Shared by the normal flow and "Try again". */
  const processRecording = async (uri: string, who: Language | null) => {
    setPhase('translating');
    setError(null);
    try {
      const { text, detectedCode } = await transcribe(uri, who);
      // In auto mode the speaker is whoever Whisper heard: English, or if not
      // English (or unrecognized), the other language of the pair.
      const speakerLang = who ?? (detectedCode === 'en' ? ENGLISH : otherLanguage);
      const listener = speakerLang.code === 'en' ? otherLanguage : ENGLISH;
      const translation = await translate(text, speakerLang, listener);

      const turn: Turn = { id: Date.now(), original: text, translation, speaker: speakerLang, listener };
      addTurn(turn);
      setRetryCtx(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await speak(translation, listener, turn.id);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhase('idle');
      if (err instanceof TranslationError) {
        if (err.nothingHeard) {
          setError('didntCatch');
        } else {
          // The recording is still on disk — offer a one-tap retry.
          setRetryCtx({ uri, who });
          setError('connectionError');
        }
      } else if (err instanceof MissingKeyError) {
        setError('notReady');
        setSetupError(err.message);
      } else {
        setError('notReady');
        setSetupError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  /** Re-runs the last failed recording without asking the person to speak again. */
  const retryLast = async () => {
    if (!retryCtx || phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await processRecording(retryCtx.uri, retryCtx.who);
  };

  /** Speaks a translation aloud: OpenAI TTS first, on-device voice as fallback. */
  const speak = async (text: string, language: Language, turnId: number) => {
    setPhase('speaking');
    const uri = ttsUriRef.current ?? (await synthesize(text, language));
    if (uri) {
      ttsUriRef.current = uri;
      releasePlayer();
      const player = createAudioPlayer(uri);
      playerRef.current = player;
      playerTurnIdRef.current = turnId;
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) setPhase('idle');
      });
      player.play();
    } else {
      Speech.speak(text, {
        language: language.speechTag,
        onDone: () => setPhase('idle'),
        onError: () => setPhase('idle'),
      });
    }
  };

  /** Replays any turn. The turn whose audio is loaded replays instantly; others re-synthesize. */
  const playTurn = async (turn: Turn) => {
    if (phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (turn.id === playerTurnIdRef.current && playerRef.current) {
      setPhase('speaking');
      await playerRef.current.seekTo(0);
      playerRef.current.play();
    } else {
      stopAllAudio();
      await speak(turn.translation, turn.listener, turn.id);
    }
  };

  /** Speaks a pre-translated quick phrase — instant, no network required. */
  const usePhrase = async (phrase: Phrase, who: Language) => {
    if (phase === 'listening' || phase === 'translating') return;
    // Rapid double-taps while the sheet closes must not add duplicate turns.
    if (Date.now() - lastPhraseAtRef.current < 600) return;
    lastPhraseAtRef.current = Date.now();
    setPhrasesOpen(false);
    setError(null);
    setRetryCtx(null);
    stopAllAudio();
    const listener = who.code === 'en' ? otherLanguage : ENGLISH;
    const turn: Turn = {
      id: Date.now(),
      original: phrase.text[who.code],
      translation: phrase.text[listener.code],
      speaker: who,
      listener,
    };
    addTurn(turn);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await speak(turn.translation, listener, turn.id);
  };

  const toggleAutoMode = () => {
    if (phase === 'listening' || phase === 'translating') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !autoMode;
    setAutoMode(next);
    savePrefs({ autoMode: next });
  };

  const sameSide = (a: Language | null, b: Language | null) => (a?.code ?? null) === (b?.code ?? null);

  const handlePressIn = (who: Language | null) => {
    if (phase === 'listening') {
      // Second tap of tap-to-talk mode: finish.
      if (sameSide(speaker, who)) void finishListening();
      return;
    }
    if (phase !== 'idle' && phase !== 'speaking') return;
    pressStartedAt.current = Date.now();
    void startListening(who);
  };

  const handlePressOut = (who: Language | null) => {
    if (phase !== 'listening' || !sameSide(speaker, who)) {
      // Released while the recorder was still starting up — note it so the
      // "tap when finished" hint appears once listening actually begins.
      if (startingRef.current) releasedEarlyRef.current = true;
      return;
    }
    const heldFor = Date.now() - pressStartedAt.current;
    if (heldFor >= HOLD_THRESHOLD_MS) {
      void finishListening();
    } else if (pressStartedAt.current !== 0) {
      // A quick tap: keep listening and wait for a second tap to finish.
      setAwaitingTap(true);
    }
  };

  const buttonState = (who: Language | null) => {
    if (phase === 'listening') return sameSide(speaker, who) ? 'listening' : 'disabled';
    if (phase === 'translating') return 'disabled';
    return 'idle';
  };

  const busy = phase === 'listening' || phase === 'translating';

  return (
    <View style={styles.screen}>
      {/* Header: quiet utility chips — the speak buttons are the focal point. */}
      <View style={styles.header}>
        <Pressable
          onPress={onChangeLanguage}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${other.changeLanguage} — ${en.changeLanguage}`}
          style={({ pressed }) => [styles.headerChip, pressed && styles.pressedDim, busy && styles.dimmed]}
        >
          <Ionicons name="language" size={20} color={colors.textMuted} />
          <Text style={styles.headerChipText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {otherLanguage.flag} {other.languageShort}
          </Text>
        </Pressable>
        <Pressable
          onPress={onShowAbout}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${other.about} — ${en.about}`}
          style={({ pressed }) => [styles.headerChip, pressed && styles.pressedDim, busy && styles.dimmed]}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={styles.headerChipText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1}>
            {other.aboutShort}
          </Text>
        </Pressable>
      </View>

      {/* The conversation thread. */}
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={[styles.threadContent, turns.length === 0 && styles.threadEmpty]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {turns.map((turn) => {
          const isLatest = turn.id === latestTurn?.id;
          const fromEnglish = turn.speaker.code === 'en';
          return (
            <Appear
              key={turn.id}
              style={[
                styles.turnCard,
                fromEnglish ? styles.turnLeft : styles.turnRight,
                isLatest && styles.turnLatest,
              ]}
            >
              <View style={styles.speakerRow}>
                <Text style={styles.speakerFlag} importantForAccessibility="no">
                  {turn.speaker.flag}
                </Text>
                <Text style={styles.originalLabel} accessibilityLanguage={turn.speaker.speechTag}>
                  {t(turn.speaker.code).youSaid}
                </Text>
              </View>
              <Text style={styles.originalText} accessibilityLanguage={turn.speaker.speechTag}>
                {turn.original}
              </Text>

              <View style={[styles.translationBlock, flipped && isLatest && styles.flippedBlock]}>
                <Text style={styles.translationLabel} accessibilityLanguage={turn.listener.speechTag}>
                  {t(turn.listener.code).translationLabel} {turn.listener.flag}
                </Text>
                <Text
                  style={isLatest ? styles.translationText : styles.translationTextOld}
                  accessibilityLanguage={turn.listener.speechTag}
                  accessibilityLiveRegion={isLatest ? 'polite' : 'none'}
                >
                  {turn.translation}
                </Text>
              </View>

              <View style={styles.turnActions}>
                <PressableScale
                  onPress={() => playTurn(turn)}
                  disabled={phase !== 'idle'}
                  accessibilityRole="button"
                  accessibilityLabel={`${t(turn.listener.code).playAgain} — ${en.playAgain}`}
                  flexFill
                  style={[styles.turnButton, phase !== 'idle' && !(isLatest && phase === 'speaking') && styles.dimmed]}
                >
                  <Ionicons name="volume-high" size={20} color={colors.primary} />
                  <Text style={styles.turnButtonText} allowFontScaling maxFontSizeMultiplier={1.5}>
                    {isLatest && phase === 'speaking'
                      ? t(turn.listener.code).playing
                      : t(turn.listener.code).playAgain}
                  </Text>
                </PressableScale>
                {isLatest && (
                  <PressableScale
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFlipped(!flipped);
                    }}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: flipped }}
                    accessibilityLabel={`${t(turn.listener.code).flip} — ${en.flip}`}
                    flexFill
                    style={[styles.turnButton, flipped && styles.turnButtonActive]}
                  >
                    <Ionicons name="swap-vertical" size={20} color={colors.primary} />
                    <Text style={styles.turnButtonText} allowFontScaling maxFontSizeMultiplier={1.5}>
                      {t(turn.listener.code).flip}
                    </Text>
                  </PressableScale>
                )}
              </View>
            </Appear>
          );
        })}

        {error ? (
          <View style={styles.errorCard} accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle" size={26} color={colors.dangerText} />
            <View style={styles.errorBody}>
              <Text style={styles.errorText} accessibilityLanguage={otherLanguage.speechTag}>
                {other[error]}
              </Text>
              <Text style={styles.errorTextSmall}>{en[error]}</Text>
              {setupError ? <Text style={styles.errorDetail}>{setupError}</Text> : null}
              {error === 'connectionError' && retryCtx ? (
                <PressableScale
                  onPress={retryLast}
                  disabled={phase !== 'idle'}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.tryAgain} — ${en.tryAgain}`}
                  style={[styles.retryButton, phase !== 'idle' && styles.dimmed]}
                >
                  <Ionicons name="refresh" size={20} color={colors.dangerText} />
                  <Text style={styles.retryText}>
                    {other.tryAgain} · {en.tryAgain}
                  </Text>
                </PressableScale>
              ) : null}
            </View>
          </View>
        ) : null}

        {phase === 'translating' ? (
          <Appear style={styles.pendingWrap}>
            <TurnSkeleton alignRight={speaker != null && speaker.code !== 'en'} />
            <View style={styles.pendingCaption} accessibilityLiveRegion="polite">
              <Text style={styles.pendingText}>{other.translating}</Text>
              <Text style={styles.pendingTextSmall}>{en.translating}</Text>
            </View>
          </Appear>
        ) : null}

        {phase === 'listening' ? (
          <Appear style={styles.statusRow}>
            <View accessibilityLiveRegion="polite" style={styles.statusInner}>
              <Ionicons name="mic" size={26} color={colors.listening} />
              <Text style={styles.statusBig}>
                {speaker ? t(speaker.code).listening : `${other.listening} · ${en.listening}`}
              </Text>
            </View>
          </Appear>
        ) : null}

        {turns.length === 0 && !error && !setupError && phase === 'idle' ? (
          <View style={styles.hint}>
            <View style={styles.hintIconCircle} importantForAccessibility="no">
              <Ionicons name="mic-outline" size={42} color={colors.primary} />
            </View>
            <Text style={styles.hintText}>{other.holdAndSpeak}</Text>
            <Text style={styles.hintTextSmall}>{en.holdAndSpeak}</Text>
            <Ionicons name="arrow-down" size={30} color={colors.accent} style={styles.hintArrow} />
          </View>
        ) : null}
      </ScrollView>

      {/* Tools: quick phrases + auto-detect toggle. */}
      <View style={styles.toolRow}>
        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPhrasesOpen(true);
          }}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${other.quickPhrases} — ${en.quickPhrases}`}
          flexFill
          style={[styles.toolButton, busy && styles.dimmed]}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.text} />
          <Text style={styles.toolButtonText} allowFontScaling maxFontSizeMultiplier={1.3}>
            {other.quickPhrases}
          </Text>
        </PressableScale>
        <PressableScale
          onPress={toggleAutoMode}
          disabled={busy}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoMode }}
          accessibilityLabel={`${other.auto} — ${en.auto}`}
          flexFill
          style={[styles.toolButton, autoMode && styles.toolButtonOn, busy && styles.dimmed]}
        >
          <Ionicons name="sparkles" size={18} color={autoMode ? colors.primary : colors.text} />
          <Text
            style={[styles.toolButtonText, autoMode && styles.toolButtonTextOn]}
            allowFontScaling
            maxFontSizeMultiplier={1.3}
          >
            {other.auto === en.auto ? en.auto : `${other.auto} · ${en.auto}`}
          </Text>
        </PressableScale>
      </View>

      {/* The speak buttons: two per-language buttons, or one auto-detect button. */}
      <View style={styles.buttons}>
        {autoMode ? (
          <AutoSpeakButton
            otherLanguage={otherLanguage}
            state={buttonState(null)}
            awaitingTapToStop={awaitingTap}
            onPressIn={() => handlePressIn(null)}
            onPressOut={() => handlePressOut(null)}
          />
        ) : (
          <>
            <SpeakButton
              language={ENGLISH}
              state={buttonState(ENGLISH)}
              awaitingTapToStop={awaitingTap && speaker?.code === 'en'}
              fill={colors.primary}
              fillPressed={colors.primaryPressed}
              onPressIn={() => handlePressIn(ENGLISH)}
              onPressOut={() => handlePressOut(ENGLISH)}
            />
            <SpeakButton
              language={otherLanguage}
              state={buttonState(otherLanguage)}
              awaitingTapToStop={awaitingTap && speaker?.code === otherLanguage.code}
              fill={colors.secondary}
              fillPressed={colors.secondaryPressed}
              onPressIn={() => handlePressIn(otherLanguage)}
              onPressOut={() => handlePressOut(otherLanguage)}
            />
          </>
        )}
      </View>

      {/* Trust cue, in both active languages. */}
      <View style={styles.privacy}>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={13} color={colors.textFaint} />
          <Text style={styles.privacyText}>{other.privacyLine}</Text>
        </View>
        <Text style={styles.privacyText}>{en.privacyLine}</Text>
      </View>

      {/* Quick phrases sheet. */}
      <Modal
        visible={phrasesOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPhrasesOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable
            style={styles.sheetDismiss}
            onPress={() => setPhrasesOpen(false)}
            accessibilityLabel={`${other.close} — ${en.close}`}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} importantForAccessibility="no" />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                <Text style={styles.sheetTitle} accessibilityRole="header">
                  {other.quickPhrases}
                </Text>
              </View>
              <Pressable
                onPress={() => setPhrasesOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={`${other.close} — ${en.close}`}
                style={({ pressed }) => [styles.sheetClose, pressed && styles.pressedDim]}
              >
                <Ionicons name="close" size={22} color={colors.primary} />
                <Text style={styles.sheetCloseText}>{other.close}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sheetSection} importantForAccessibility="no">
                🇺🇸 English → {otherLanguage.flag} {otherLanguage.nativeName}
              </Text>
              {CLINICIAN_PHRASES.map((phrase) => (
                <PressableScale
                  key={phrase.id}
                  onPress={() => usePhrase(phrase, ENGLISH)}
                  accessibilityRole="button"
                  accessibilityLabel={phrase.text.en}
                  style={styles.phraseRow}
                >
                  <View style={styles.phraseIconCircle} importantForAccessibility="no">
                    <Ionicons name={phrase.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.phraseTextWrap}>
                    <Text style={styles.phrasePrimary}>{phrase.text.en}</Text>
                    <Text style={styles.phraseSecondary} accessibilityLanguage={otherLanguage.speechTag}>
                      {phrase.text[otherLanguage.code]}
                    </Text>
                  </View>
                  <Ionicons name="volume-high" size={22} color={colors.textFaint} />
                </PressableScale>
              ))}

              <Text style={styles.sheetSection} importantForAccessibility="no">
                {otherLanguage.flag} {otherLanguage.nativeName} → 🇺🇸 English
              </Text>
              {PATIENT_PHRASES.map((phrase) => (
                <PressableScale
                  key={phrase.id}
                  onPress={() => usePhrase(phrase, otherLanguage)}
                  accessibilityRole="button"
                  accessibilityLabel={phrase.text[otherLanguage.code]}
                  accessibilityLanguage={otherLanguage.speechTag}
                  style={styles.phraseRow}
                >
                  <View style={[styles.phraseIconCircle, styles.phraseIconCircleSecondary]} importantForAccessibility="no">
                    <Ionicons name={phrase.icon} size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.phraseTextWrap}>
                    <Text style={styles.phrasePrimary} accessibilityLanguage={otherLanguage.speechTag}>
                      {phrase.text[otherLanguage.code]}
                    </Text>
                    <Text style={styles.phraseSecondary}>{phrase.text.en}</Text>
                  </View>
                  <Ionicons name="volume-high" size={22} color={colors.textFaint} />
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  headerChip: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    flexShrink: 1,
  },
  headerChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  pressedDim: {
    opacity: 0.6,
  },
  dimmed: {
    opacity: 0.4,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  threadEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hint: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  hintIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  hintText: {
    fontFamily: fonts.displayMedium,
    fontSize: type.body,
    color: colors.text,
    textAlign: 'center',
  },
  hintTextSmall: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
  },
  hintArrow: {
    marginTop: spacing.md,
  },
  statusRow: {
    paddingVertical: spacing.sm,
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  statusBig: {
    fontFamily: fonts.displayMedium,
    fontSize: type.title,
    color: colors.listening,
    textAlign: 'center',
  },
  pendingWrap: {
    gap: spacing.xs,
  },
  pendingCaption: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    paddingLeft: spacing.xs,
  },
  pendingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  pendingTextSmall: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
  },
  turnCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xxs,
    width: '88%',
    ...shadows.card,
  },
  turnLeft: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: radius.sm,
  },
  turnRight: {
    alignSelf: 'flex-end',
    borderTopRightRadius: radius.sm,
  },
  turnLatest: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadows.raised,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  speakerFlag: {
    fontSize: 16,
  },
  originalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  originalText: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    lineHeight: type.small * 1.45,
  },
  translationBlock: {
    marginTop: spacing.sm,
    gap: spacing.xxs,
  },
  flippedBlock: {
    transform: [{ rotate: '180deg' }],
    paddingVertical: spacing.sm,
  },
  translationLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  translationText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.translation,
    color: colors.text,
    lineHeight: type.translation * 1.3,
  },
  translationTextOld: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.text,
    lineHeight: type.body * 1.4,
  },
  turnActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  turnButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: spacing.xs,
  },
  turnButtonActive: {
    backgroundColor: colors.primaryTint,
  },
  turnButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '94%',
    alignSelf: 'center',
  },
  errorBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.dangerText,
    lineHeight: type.body * 1.4,
  },
  errorTextSmall: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.dangerText,
    lineHeight: type.small * 1.4,
  },
  errorDetail: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.dangerText,
    opacity: 0.8,
    lineHeight: type.caption * 1.4,
  },
  retryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.dangerText,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  retryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.dangerText,
  },
  toolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  toolButtonOn: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceTint,
  },
  toolButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  toolButtonTextOn: {
    color: colors.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  privacy: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 2,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  privacyText: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheetDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '78%',
    paddingBottom: spacing.xl,
    ...shadows.floating,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: type.button,
    color: colors.text,
    flexShrink: 1,
  },
  sheetClose: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  sheetCloseText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  sheetContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  sheetSection: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: MIN_TARGET + 8,
    ...shadows.card,
  },
  phraseIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseIconCircleSecondary: {
    backgroundColor: colors.surfaceTintSecondary,
  },
  phraseTextWrap: {
    flex: 1,
    gap: 2,
  },
  phrasePrimary: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.text,
    lineHeight: type.body * 1.35,
  },
  phraseSecondary: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    lineHeight: type.small * 1.35,
  },
});
