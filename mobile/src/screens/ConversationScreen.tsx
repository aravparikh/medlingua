import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AudioModule,
  createAudioPlayer,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNetworkState } from 'expo-network';
import * as Speech from 'expo-speech';
import { CameraIcon, ChatIcon, CloudOffIcon, DocumentIcon, InfoIcon, LanguageIcon, PencilIcon, SparkleIcon } from '../components/icons';

import { BODY_REGIONS, type BodyRegionId } from '../config/bodyRegions';
import { ENGLISH, type Language } from '../config/languages';
import type { Phrase } from '../config/phrases';
import { t } from '../i18n/strings';
import {
  clearSpokenAudio,
  MissingKeyError,
  readMedicationLabel,
  simplify,
  summarizeVisit,
  synthesize,
  transcribe,
  translate,
  TranslationError,
  type FlaggedTerm,
  type MedLabelResult,
} from '../services/openai';
import { SAFEGUARD_ENABLED } from '../config/safeguard';
import { gatedTranslate } from '../services/safeguard';
import { isDisplayable, type GateVerdict } from '../services/safeguardDecision';
import { playStopChime, releaseChimes } from '../services/chimes';
import { loadPrefs, savePrefs } from '../services/storage';
import { bilingual, radius, spacing, tapTarget, useTheme, type ColorTokens } from '../theme';
import { Appear } from '../components/Appear';
import { BodyMapModal } from '../components/BodyMap';
import { FullscreenTranslation } from '../components/FullscreenTranslation';
import { RightsCard } from '../components/RightsCard';
import { SummaryModal, type SummaryState } from '../components/SummaryModal';
import { AutoSpeakButton, SpeakButton } from '../components/SpeakButton';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { ErrorNotice, HeldNotice, Translating } from '../components/conversation/Notices';
import { PhraseSheet } from '../components/conversation/PhraseSheet';
import { RecordingPanel } from '../components/conversation/RecordingPanel';
import { ScanSheet } from '../components/conversation/ScanSheet';
import { TeachBackDialog } from '../components/conversation/TeachBackDialog';
import { LedgerRow, LiveLine } from '../components/conversation/Turns';
import { TypeSheet } from '../components/conversation/TypeSheet';

export type Phase = 'idle' | 'listening' | 'translating' | 'speaking';

/** The one AudioPlayer event we use, typed from the SDK's own status shape. */
interface PlaybackSubscriber {
  addListener(
    event: 'playbackStatusUpdate',
    listener: (status: AudioStatus) => void,
  ): { remove(): void };
}

export interface Turn {
  id: number;
  original: string;
  translation: string;
  speaker: Language;
  listener: Language;
  /** A verbatim name entry (no translation): renders as a single-name card. */
  isName?: boolean;
  /** Confidence-gate verdict. Absent on turns the gate never saw (quick
   * phrases, the body map, names) and when the safeguard is switched off. */
  verdict?: GateVerdict;
  /** Spans the model considered risky; highlighted inline on a CAUTION turn. */
  flaggedTerms?: FlaggedTerm[];
  confidence?: number | null;
}

/** An utterance the gate gave up on — recorded so the visit summary can say so. */
export interface Escalation {
  /** ISO-8601 UTC. */
  at: string;
  original: string;
  reason: string;
  attempts: number;
}

interface Props {
  otherLanguage: Language;
  /** The visit's transcript. Held by App so it survives the About screen,
   * but memory-only: cleared on language change and gone when the app closes. */
  turns: Turn[];
  onTurnsChange: (turns: Turn[]) => void;
  /** Utterances the confidence gate escalated, held alongside the transcript
   * so they can be appended verbatim to the visit summary. */
  escalations: Escalation[];
  onEscalation: (escalation: Escalation) => void;
  onChangeLanguage: () => void;
  onShowAbout: () => void;
}

/** Below this normalized mic level for SILENCE_NUDGE_MS, show "speak louder". */
const QUIET_LEVEL = 0.12;
const SILENCE_NUDGE_MS = 2500;

/**
 * Recording options. Metering must be enabled here AND the same options are
 * passed to prepareToRecordAsync so the flag is unambiguously applied on the
 * native side. Mono (numberOfChannels 1): a phone has one useful mic, and
 * Whisper wants mono — stereo can leave one channel dead and the file quiet.
 */
const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1,
};

/**
 * iOS/Android metering is dBFS: roughly -60 (silent) … 0 (full scale), with
 * arm's-length speech around -35…-12. Map that speech window to 0..1 so quiet
 * talkers still move the bars; clamp the rest.
 */
const DB_FLOOR = -55;
const DB_CEIL = -8;
function normalizeMetering(db: number): number {
  return Math.min(1, Math.max(0, (db - DB_FLOOR) / (DB_CEIL - DB_FLOOR)));
}


/**
 * The conversation screen — where 95% of usage happens. Two big buttons, one
 * per language (or a single auto-detect button). One tap starts recording;
 * the bottom of the screen becomes a recording panel (elapsed time, a live
 * mic meter, one giant Done button) so nothing needs to be held and nothing
 * needs precision. The running thread makes the back-and-forth visible;
 * nothing is ever written to disk.
 */
export function ConversationScreen({
  otherLanguage,
  turns,
  onTurnsChange,
  escalations,
  onEscalation,
  onChangeLanguage,
  onShowAbout,
}: Props) {
  // Metering powers the live level meter — real "I can hear you" feedback,
  // not a decorative pulse.
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 120);

  const [phase, setPhase] = useState<Phase>('idle');
  const [speaker, setSpeaker] = useState<Language | null>(null);
  const [error, setError] = useState<
    'didntCatch' | 'connectionError' | 'micPermission' | 'notReady' | 'mayHaveMisheard' | null
  >(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [retryCtx, setRetryCtx] = useState<{ uri: string; who: Language | null } | null>(null);
  /** True after ~2s of near-silence while recording — shows "speak louder". */
  const [tooQuiet, setTooQuiet] = useState(false);
  const [autoMode, setAutoMode] = useState(() => loadPrefs().autoMode ?? false);
  const [flipped, setFlipped] = useState(false);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [typedDraft, setTypedDraft] = useState('');
  /** When true, the Type sheet enters a name in verbatim (no translation). */
  const [nameMode, setNameMode] = useState(false);
  /** Turn whose translation is blown up fullscreen; null when closed. */
  const [fullscreenTurn, setFullscreenTurn] = useState<Turn | null>(null);
  /** Teach-back flow. ask → (no) → loading2 → ask2 → (no) → failed. */
  const [teach, setTeach] = useState<{
    stage: 'loading' | 'ask' | 'loading2' | 'ask2' | 'failed' | 'error';
    text?: string;
    /** The clinician message being explained — carried through every stage so
     * the "explain simpler" retry can never target a different turn. */
    source?: string;
  } | null>(null);
  /** Ephemeral visit summary — state-only, wiped when the modal closes. */
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [bodyMapOpen, setBodyMapOpen] = useState(false);
  /** F5: medication label scan — photo is sent once, never persisted. */
  const [scan, setScan] = useState<
    | { status: 'loading' }
    | { status: 'ready'; result: MedLabelResult }
    | { status: 'unreadable' }
    | { status: 'permission' }
    | { status: 'error' }
    | null
  >(null);
  const [showDisclaimer, setShowDisclaimer] = useState(() => !(loadPrefs().disclaimerSeen ?? false));
  /** Confidence gate: which stage of the two-step check is running, if any. */
  const [gateStage, setGateStage] = useState<'translating' | 'checking' | null>(null);
  /** A withheld translation. The text is deliberately NOT carried here — a
   * blocked translation is never put on screen, not even greyed out. */
  const [gateHeld, setGateHeld] = useState<{ stage: 'block' | 'escalate'; speaker: Language } | null>(null);
  /**
   * Consecutive blocked attempts at getting the CURRENT thing across. Reset the
   * moment anything gets through, so a difficult sentence never escalates the
   * next one — this is a per-utterance count, never a running total for the visit.
   */
  const blockStreakRef = useRef(0);
  /** Interpreter-rights card — reachable from the teach-back dead end. */
  const [rightsOpen, setRightsOpen] = useState(false);
  /** Turn awaiting delete confirmation; null when nothing is pending. */
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Offline awareness: quick phrases and the body map keep working (canned
  // text + on-device voice); everything that needs the network is disabled
  // with a calm banner instead of a surprise error.
  const networkState = useNetworkState();
  const offline = networkState.isInternetReachable === false;

  const startingRef = useRef(false);
  const finishingRef = useRef(false);
  const listeningStartedAtRef = useRef(0);
  /** Last time the mic heard something above QUIET_LEVEL. */
  const lastLoudAtRef = useRef(0);
  const playerRef = useRef<AudioPlayer | null>(null);
  /** Which turn the loaded player belongs to — replay must never play another turn's audio. */
  const playerTurnIdRef = useRef<number | null>(null);
  const ttsUriRef = useRef<string | null>(null);
  /** Bumped whenever current speech is superseded (new action or unmount), so
   * a synthesize request still in flight can't start playing stale audio. */
  const speakSessionRef = useRef(0);
  const lastPhraseAtRef = useRef(0);
  /** Rapid double-taps on API-firing buttons must not fire twice (same 600ms
   * window speakPhrase uses). */
  const lastActionAtRef = useRef(0);
  /** Pending sheet→modal handoff (see the body-map hero card). */
  const modalSwapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const en = t('en');
  const other = t(otherLanguage.code);
  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  /** Recorder metering is in dB (≈ -160 silent … 0 loudest); normal speech at
   * arm's length sits around -30 to -15. Normalized to 0..1 for the meter;
   * null when metering isn't available (web), which renders resting bars. */
  const meterLevel =
    phase === 'listening' && typeof recorderState.metering === 'number'
      ? normalizeMetering(recorderState.metering)
      : null;

  // The "speak louder" nudge: quiet for SILENCE_NUDGE_MS while recording.
  // People fix their volume mid-sentence instead of after a failed attempt.
  useEffect(() => {
    if (phase !== 'listening' || meterLevel == null) {
      if (tooQuiet) setTooQuiet(false);
      return;
    }
    if (meterLevel > QUIET_LEVEL) {
      lastLoudAtRef.current = Date.now();
      if (tooQuiet) setTooQuiet(false);
    } else if (!tooQuiet && Date.now() - lastLoudAtRef.current > SILENCE_NUDGE_MS) {
      setTooQuiet(true);
    }
  }, [phase, meterLevel, tooQuiet]);

  useEffect(() => {
    // iOS audio sessions respect the silent switch by default, so on a muted
    // phone (most phones in a clinic) playback is inaudible until the session
    // is configured for playback. The recording flow sets this as a side
    // effect, but phrases/typed/body-map/replay speak without ever recording.
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    // A force-quit can strand the previous session's TTS file in the cache;
    // clear it on the way in, not just on the way out.
    clearSpokenAudio();
    return () => {
      speakSessionRef.current += 1;
      if (modalSwapTimer.current) clearTimeout(modalSwapTimer.current);
      playerRef.current?.remove();
      releaseChimes();
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
    speakSessionRef.current += 1;
    releasePlayer();
    Speech.stop();
    clearSpokenAudio();
    ttsUriRef.current = null;
  };

  const addTurn = (turn: Turn) => {
    onTurnsChange([...turns, turn]);
    setFlipped(false);
  };

  /**
   * Removes one message from the visit thread — for a mis-transcription, or
   * something the patient would rather not have on screen. Nothing was ever
   * written to disk, so this is purely dropping it from memory. Deliberately
   * behind a confirm step: an accidental tap must not erase what someone just
   * said. Also stops playback when the deleted card owns the loaded audio.
   */
  const deleteTurn = (turn: Turn) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (playerTurnIdRef.current === turn.id) stopAllAudio();
    setConfirmDeleteId(null);
    onTurnsChange(turns.filter((t) => t.id !== turn.id));
  };

  /**
   * Deletes a finished recording from the OS cache. The patient's voice is
   * the most sensitive audio this app touches and the UI promises nothing is
   * saved — so a recording is removed the moment it is no longer needed
   * (turn completed, retry superseded, or recording cancelled). Best-effort:
   * these are cache files the OS purges on its own schedule regardless.
   */
  const discardRecordingFile = (uri: string | null | undefined) => {
    if (Platform.OS === 'web' || !uri) return;
    try {
      new File(uri).delete();
    } catch {
      // Best-effort — see above.
    }
  };

  const startListening = async (who: Language | null) => {
    if (startingRef.current) return;
    startingRef.current = true;
    setError(null);
    setSetupError(null);
    // A new recording supersedes any kept-for-retry one — remove its file.
    if (retryCtx) discardRecordingFile(retryCtx.uri);
    setRetryCtx(null);
    stopAllAudio();

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('micPermission');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // NOTE: the start chime is deliberately NOT played here. Playing it
      // through an audio player as recording begins shares the iOS audio
      // session, and the chime's completion (~1s in) reconfigures that session
      // and cuts the just-started recording short — the recording died right
      // after it began. Haptics + the recording panel already signal "started";
      // the stop chime is safe because it fires after recorder.stop().
      // allowsRecording routes iOS audio to the quiet earpiece, so it is only
      // enabled while actually recording and switched off again for playback.
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      // Pass options explicitly so isMeteringEnabled is unambiguously applied
      // for this prepare — the constructor flag alone is not always honored.
      await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
      recorder.record();
      listeningStartedAtRef.current = Date.now();
      lastLoudAtRef.current = Date.now();
      setTooQuiet(false);
      setSpeaker(who);
      setPhase('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setError('connectionError');
      setPhase('idle');
    } finally {
      startingRef.current = false;
    }
  };

  const finishListening = async (who: Language | null = speaker) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setTooQuiet(false);
    setPhase('translating');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      playStopChime();

      const heldFor = Date.now() - listeningStartedAtRef.current;
      const uri = recorder.uri;
      if (!uri || heldFor < 500) {
        // Too short to contain speech — friendly nudge instead of an API call.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('didntCatch');
        setPhase('idle');
        return;
      }
      await processRecording(uri, who);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('connectionError');
      setPhase('idle');
    } finally {
      finishingRef.current = false;
    }
  };

  /**
   * Translates one utterance through the confidence gate.
   *
   * Returns the turn to display, or null when the gate withheld it — in which
   * case the held-state UI is already showing and NOTHING is spoken. Speaking a
   * translation the gate rejected would be the worst failure this app has, so
   * TTS only ever happens on a turn this function actually returned.
   *
   * With SAFEGUARD_ENABLED false this is the original single-call path.
   */
  const translateThroughGate = async (
    text: string,
    from: Language,
    to: Language,
  ): Promise<Turn | null> => {
    if (!SAFEGUARD_ENABLED) {
      const translation = await translate(text, from, to);
      return { id: Date.now(), original: text, translation, speaker: from, listener: to };
    }

    setGateHeld(null);
    setGateStage('translating');
    try {
      const result = await gatedTranslate(text, from, to, blockStreakRef.current, () =>
        setGateStage('checking'),
      );

      if (!isDisplayable(result.verdict)) {
        blockStreakRef.current += 1;
        if (result.verdict === 'escalate') {
          onEscalation({
            at: new Date().toISOString(),
            original: text,
            reason: result.reason ?? 'repeated-blocks',
            attempts: blockStreakRef.current,
          });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setGateHeld({ stage: result.verdict === 'escalate' ? 'escalate' : 'block', speaker: from });
        return null;
      }

      // Something got through: this utterance is no longer in trouble.
      blockStreakRef.current = 0;
      return {
        id: Date.now(),
        original: text,
        translation: result.translation,
        speaker: from,
        listener: to,
        verdict: result.verdict,
        flaggedTerms: result.flaggedTerms,
        confidence: result.confidence,
      };
    } finally {
      setGateStage(null);
    }
  };

  /** Transcribe → translate → speak. Shared by the normal flow and "Try again". */
  const processRecording = async (uri: string, who: Language | null) => {
    setPhase('translating');
    setError(null);
    try {
      const { text, detectedCode, lowConfidence } = await transcribe(uri, who);
      if (lowConfidence) {
        // Whisper wasn't sure what it heard. Asking to repeat beats
        // confidently speaking a possibly-wrong translation.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('mayHaveMisheard');
        setPhase('idle');
        return;
      }
      // In auto mode the speaker is whoever Whisper heard: English, or if not
      // English (or unrecognized), the other language of the pair.
      const speakerLang = who ?? (detectedCode === 'en' ? ENGLISH : otherLanguage);
      const listener = speakerLang.code === 'en' ? otherLanguage : ENGLISH;
      const turn = await translateThroughGate(text, speakerLang, listener);
      setRetryCtx(null);
      // The audio has served its purpose either way: a withheld translation is
      // re-attempted by speaking again, never by re-running the same recording.
      discardRecordingFile(uri);
      if (!turn) {
        // The gate withheld it. Nothing is shown and nothing is spoken.
        setPhase('idle');
        return;
      }
      addTurn(turn);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await speak(turn.translation, listener, turn.id);
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
          // Dev builds surface the underlying cause (timeout, HTTP status,
          // upload failure) in the error card — invisible in production.
          if (__DEV__) setSetupError(err.message);
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

  /**
   * Speaks a translation aloud: OpenAI TTS first, on-device voice as fallback.
   * `slow` re-synthesizes at a deliberate pace and never reuses or overwrites
   * the turn's cached normal-pace audio. Offline skips synthesis entirely —
   * the on-device voice answers immediately instead of waiting on a dead fetch.
   */
  const speak = async (text: string, language: Language, turnId: number, slow = false) => {
    const session = speakSessionRef.current;
    setPhase('speaking');
    // Re-assert playback mode: a recording may have routed audio to the quiet
    // earpiece, and the session must override the silent switch (see mount).
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    const cached = slow ? null : ttsUriRef.current;
    const uri = cached ?? (offline ? null : await synthesize(text, language, slow));
    // Superseded while synthesizing (new recording, phrase, or screen change):
    // whoever superseded us owns the audio and the phase now — do nothing.
    if (speakSessionRef.current !== session) return;
    if (uri) {
      if (!slow) ttsUriRef.current = uri;
      releasePlayer();
      const player = createAudioPlayer(uri);
      playerRef.current = player;
      // Slow audio is never registered for instant replay — "Play again"
      // must always mean the normal pace.
      playerTurnIdRef.current = slow ? null : turnId;
      // AudioPlayer inherits addListener from SharedObject -> EventEmitter, but
      // under TypeScript 6 that generic chain (SharedObject<Record<never, never>>
      // feeding EventEmitter<EventsMap>) fails to resolve, so the inherited
      // members are missing from the published type. The API itself is correct
      // and unchanged: the SDK 57 docs still document
      // addListener('playbackStatusUpdate') as the way to observe an
      // imperatively created player. Asserted narrowly, not to `any`, so the
      // status argument stays typed.
      (player as unknown as PlaybackSubscriber).addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) setPhase('idle');
      });
      player.play();
    } else {
      Speech.speak(text, {
        language: language.speechTag,
        rate: slow ? 0.65 : 1,
        onDone: () => {
          if (speakSessionRef.current === session) setPhase('idle');
        },
        onError: () => {
          if (speakSessionRef.current === session) setPhase('idle');
        },
      });
    }
  };

  /** "Slowly": replays a turn re-synthesized word-by-word for teach-back-style listening. */
  const playTurnSlow = async (turn: Turn) => {
    if (phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopAllAudio();
    await speak(turn.translation, turn.listener, turn.id, true);
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
  const speakPhrase = async (phrase: Phrase, who: Language) => {
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

  /** Translate + speak typed text — the fallback for loud rooms or a failing mic. */
  const sendTypedText = async (who: Language) => {
    const text = typedDraft.trim();
    if (!text || phase === 'listening' || phase === 'translating' || doubleTapped()) return;
    setTypeOpen(false);
    setTypedDraft('');
    setError(null);
    setRetryCtx(null);
    stopAllAudio();

    // Name mode: no API call. The name is added verbatim (never translated or
    // "corrected") and spoken in the chosen language so the other person hears
    // the right pronunciation. This is the reliable path for names Whisper
    // can't capture cold — the person spells it out themselves.
    if (nameMode) {
      setNameMode(false);
      const turn: Turn = { id: Date.now(), original: '', translation: text, speaker: who, listener: who, isName: true };
      addTurn(turn);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await speak(text, who, turn.id);
      return;
    }

    setPhase('translating');
    try {
      const listener = who.code === 'en' ? otherLanguage : ENGLISH;
      const turn = await translateThroughGate(text, who, listener);
      if (!turn) {
        // Withheld by the gate: the held-state card is showing instead.
        setPhase('idle');
        return;
      }
      addTurn(turn);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await speak(turn.translation, listener, turn.id);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhase('idle');
      if (err instanceof MissingKeyError) {
        setError('notReady');
        setSetupError(err.message);
      } else if (err instanceof TranslationError) {
        setError('connectionError');
        if (__DEV__) setSetupError(err.message);
      } else {
        setError('notReady');
        setSetupError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  /** Speaks "My pain is n out of 10" for the tapped number — patient side. */
  const speakPainNumber = async (n: number) => {
    const phrase: Phrase = {
      id: `pain-${n}`,
      icon: 'speedometer-outline',
      text: Object.fromEntries(
        ['en', otherLanguage.code].map((code) => [code, t(code).painIs.replace('{n}', String(n))]),
      ),
    };
    await speakPhrase(phrase, otherLanguage);
  };

  /** True when this tap follows another API-firing tap within 600ms. */
  const doubleTapped = () => {
    const now = Date.now();
    if (now - lastActionAtRef.current < 600) return true;
    lastActionAtRef.current = now;
    return false;
  };

  /** F2: teach-back — re-explain the clinician's message as simply as possible. */
  const startTeachBack = async (turn: Turn) => {
    if (phase !== 'idle' || offline || doubleTapped()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTeach({ stage: 'loading', source: turn.original });
    try {
      const explained = await simplify(turn.original, otherLanguage, false);
      stopAllAudio();
      setTeach({ stage: 'ask', text: explained, source: turn.original });
      // Negative id: teach-back audio must never be mistaken for a turn's
      // cached audio by the replay path.
      await speak(explained, otherLanguage, -turn.id);
    } catch {
      stopAllAudio();
      setPhase('idle');
      setTeach({ stage: 'error' });
    }
  };

  const answerTeach = async (understood: boolean) => {
    if (!teach || (teach.stage !== 'ask' && teach.stage !== 'ask2')) return;
    stopAllAudio();
    setPhase('idle');
    if (understood) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTeach(null);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (teach.stage === 'ask2') {
      // Two failed explanations: a human interpreter is the right next step.
      setTeach({ stage: 'failed' });
      return;
    }
    setTeach({ stage: 'loading2', source: teach.source });
    try {
      const source = teach.source ?? teach.text ?? '';
      let simpler = await simplify(source, otherLanguage, true);
      // A retry that repeats the first explanation verbatim is a silent no-op
      // for the patient — push back once, then accept whatever comes.
      const same = (a: string, b?: string) =>
        !!b && a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();
      if (same(simpler, teach.text)) {
        simpler = await simplify(source, otherLanguage, true, simpler);
      }
      setTeach({ stage: 'ask2', text: simpler, source: teach.source });
      await speak(simpler, otherLanguage, -Date.now());
    } catch {
      stopAllAudio();
      setPhase('idle');
      setTeach({ stage: 'error' });
    }
  };

  const replayTeach = async () => {
    if (!teach?.text || phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopAllAudio();
    await speak(teach.text, otherLanguage, -Date.now());
  };

  const closeTeach = () => {
    stopAllAudio();
    setPhase('idle');
    setTeach(null);
  };

  /**
   * Teach-back failed twice → the patient needs a human interpreter, and the
   * rights card is how they ask for one. Close the teach modal, let the
   * dismissal settle (see the body-map handoff note), then present the card.
   */
  const showRightsFromTeach = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeTeach();
    if (modalSwapTimer.current) clearTimeout(modalSwapTimer.current);
    modalSwapTimer.current = setTimeout(() => setRightsOpen(true), 350);
  };

  /** F4: body map picked a region + intensity — say it in English, log the turn. */
  const confirmBodyPain = async (regionId: BodyRegionId, n: number) => {
    if (doubleTapped()) return;
    const region = BODY_REGIONS[regionId];
    const sentence = (code: string) =>
      t(code).myHurtsPain.replace('{part}', region.name[code]).replace('{n}', String(n));
    setBodyMapOpen(false);
    setError(null);
    setRetryCtx(null);
    stopAllAudio();
    const turn: Turn = {
      id: Date.now(),
      original: sentence(otherLanguage.code),
      translation: sentence('en'),
      speaker: otherLanguage,
      listener: ENGLISH,
    };
    addTurn(turn);
    await speak(turn.translation, ENGLISH, turn.id);
  };

  /**
   * Privacy contract: the picker writes the photo into the app cache as a side
   * effect. The label photo is the most sensitive artifact this app touches,
   * and the UI promises "nothing is saved" — so every exit path (success,
   * unreadable, error, even a crash mid-scan) must delete the cached file(s).
   * Only the in-memory base64 is sent to the API; nothing image-shaped remains
   * on disk afterwards.
   */
  const deletePickedAssets = (picked: ImagePicker.ImagePickerResult | null) => {
    if (Platform.OS === 'web' || !picked || picked.canceled) return;
    for (const asset of picked.assets ?? []) {
      try {
        new File(asset.uri).delete();
      } catch {
        // Best-effort: the OS clears its own cache eventually regardless.
      }
    }
  };

  /** F5: photograph a medication label → plain-language bilingual explanation. */
  const openScanner = async () => {
    if (busy || offline) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let picked: ImagePicker.ImagePickerResult | null = null;
    try {
      if (Platform.OS === 'web') {
        // Browsers can't reliably open a camera capture flow — the library
        // picker covers web preview/testing.
        picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.5 });
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setScan({ status: 'permission' });
          return;
        }
        picked = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, allowsEditing: true });
      }
      if (picked.canceled || !picked.assets?.[0]?.base64) return;
      setScan({ status: 'loading' });
      const result = await readMedicationLabel(picked.assets[0].base64, otherLanguage);
      if (!result.readable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setScan({ status: 'unreadable' });
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScan({ status: 'ready', result });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScan({ status: 'error' });
    } finally {
      deletePickedAssets(picked);
    }
  };

  /** Reads the scanned explanation aloud in the patient's language. */
  const speakScan = async () => {
    if (scan?.status !== 'ready' || phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = scan.result;
    const parts = [r.name, r.howMuch.other, r.when.other, r.warnings.other].filter(Boolean);
    stopAllAudio();
    await speak(parts.join('. '), otherLanguage, -Date.now());
  };

  const closeScan = () => {
    stopAllAudio();
    setPhase('idle');
    setScan(null);
  };

  /** F3: builds the ephemeral bilingual visit summary from the in-memory thread. */
  const openSummary = async (currentTurns: Turn[]) => {
    if (busy || offline || currentTurns.length < 2 || doubleTapped()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSummary({ status: 'loading' });
    try {
      const text = await summarizeVisit(
        currentTurns.map((turn) => ({ speaker: turn.speaker, text: turn.original })),
        otherLanguage,
      );
      // The disclaimer travels with the summary wherever it is copied/shared.
      // Escalations are appended here, deterministically, rather than being
      // fed to the model: summarizeVisit validates its own output against the
      // transcript, and a note about something that never got translated has
      // no transcript line to ground it. Assembling it in code also means the
      // wording cannot be paraphrased away by a retry.
      const escalationBlock =
        escalations.length > 0
          ? `\n\n${other.gateEscalateTitle}\n${en.gateEscalateTitle}\n` +
            escalations
              .map((e) => `• "${e.original}" — not translated reliably after ${e.attempts} attempts`)
              .join('\n')
          : '';
      setSummary({
        status: 'ready',
        text: `${text}${escalationBlock}\n\n${other.aiDisclaimer}\n${en.aiDisclaimer}`,
      });
    } catch {
      setSummary({ status: 'error' });
    }
  };

  const dismissDisclaimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDisclaimer(false);
    savePrefs({ disclaimerSeen: true });
  };

  const toggleAutoMode = () => {
    if (phase === 'listening' || phase === 'translating') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !autoMode;
    setAutoMode(next);
    savePrefs({ autoMode: next });
  };

  /** One tap starts recording. The whole bottom of the screen then becomes
   * the recording panel, so finishing is one giant unmissable Done tap. */
  const startTap = (who: Language | null) => {
    if (offline) return;
    if (phase !== 'idle' && phase !== 'speaking') return;
    void startListening(who);
  };

  /** Stops the recording and throws it away — no transcription, no turn. */
  const cancelListening = async () => {
    if (finishingRef.current || phase !== 'listening') return;
    finishingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTooQuiet(false);
    try {
      await recorder.stop();
    } catch {
      // Discarding anyway.
    }
    discardRecordingFile(recorder.uri);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setPhase('idle');
    finishingRef.current = false;
  };

  const busy = phase === 'listening' || phase === 'translating';

  const recordingPanelVisible = phase === 'listening';


  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const pastTurns = latestTurn ? turns.filter((turn) => turn.id !== latestTurn.id) : turns;
  const pendingRole = speaker == null || speaker.code === 'en' ? 'clinician' : 'patient';

  return (
    <View style={s.screen}>
      {/* Header: the patient's language, the auto-detect toggle, about. */}
      <View style={s.header}>
        <Button
          label={{ primary: otherLanguage.nativeName }}
          lang={otherLanguage.code}
          speechTag={otherLanguage.speechTag}
          variant="quiet"
          icon={<LanguageIcon size={22} color={colors.ink} />}
          onPress={onChangeLanguage}
          disabled={busy}
          accessibilityLabel={`${other.changeLanguage}. ${en.changeLanguage}`}
          style={s.headerLanguage}
        />
        <Pressable
          onPress={toggleAutoMode}
          disabled={busy}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoMode, disabled: busy }}
          accessibilityLabel={`${other.auto}. ${en.auto}`}
          style={({ pressed }) => [s.iconButton, autoMode && { backgroundColor: colors.surface }, pressed && { backgroundColor: colors.surfacePressed }, busy && s.disabled]}
        >
          <SparkleIcon size={22} color={autoMode ? colors.accent : colors.ink2} />
        </Pressable>
        <Pressable
          onPress={onShowAbout}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${other.about}. ${en.about}`}
          style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: colors.surfacePressed }, busy && s.disabled]}
        >
          <InfoIcon size={22} color={colors.ink2} />
        </Pressable>
      </View>

      {offline ? (
        <Appear style={s.banner} accessibilityLiveRegion="polite">
          <CloudOffIcon size={22} color={colors.ink2} />
          <Label {...bilingual(other.offlineLine, en.offlineLine)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="caption" tone="ink2" style={s.bannerText} />
        </Appear>
      ) : null}

      {/* First-session honesty: AI translation has limits. Yields while recording
         so the tall banner never pushes Done off a small screen. */}
      {showDisclaimer && !recordingPanelVisible ? (
        <View style={s.disclaimer}>
          <View style={s.banner}>
            <InfoIcon size={22} color={colors.ink2} />
            <View style={s.bannerText}>
              <Label {...bilingual(other.aiDisclaimer, en.aiDisclaimer)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="caption" />
              <Label {...bilingual(other.dataConsent, en.dataConsent)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="caption" />
            </View>
          </View>
          <Button label={bilingual(other.ok, en.ok)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} variant="outline" onPress={dismissDisclaimer} style={s.disclaimerOk} />
        </View>
      ) : null}

      {turns.length >= 2 ? (
        <Button
          label={bilingual(other.summary, en.summary)}
          lang={otherLanguage.code}
          speechTag={otherLanguage.speechTag}
          variant="outline"
          icon={<DocumentIcon size={20} color={colors.ink} />}
          onPress={() => openSummary(turns)}
          disabled={busy || offline}
          style={s.summary}
        />
      ) : null}

      {/* The thread: a quiet ledger of past turns, then the live line. */}
      <ScrollView
        ref={scrollRef}
        style={s.thread}
        contentContainerStyle={[s.threadContent, turns.length === 0 && s.threadEmpty]}
        // Jump, don't glide: the live line must be fully in view the moment it
        // exists, and a smooth scroll can finish before a taller row has laid out.
        onContentSizeChange={() => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }))}
      >
        {pastTurns.map((turn) => (
          <LedgerRow
            key={turn.id}
            turn={turn}
            confirming={confirmDeleteId === turn.id}
            onRequest={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setConfirmDeleteId(confirmDeleteId === turn.id ? null : turn.id);
            }}
            onCancel={() => setConfirmDeleteId(null)}
            onConfirm={() => deleteTurn(turn)}
            onFullscreen={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFullscreenTurn(turn);
            }}
          />
        ))}

        {latestTurn ? (
          <Appear key={latestTurn.id} style={s.live}>
            <LiveLine
              turn={latestTurn}
              otherLanguage={otherLanguage}
              phase={phase}
              flipped={flipped}
              offline={offline}
              confirming={confirmDeleteId === latestTurn.id}
              onRequest={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setConfirmDeleteId(confirmDeleteId === latestTurn.id ? null : latestTurn.id);
              }}
              onCancel={() => setConfirmDeleteId(null)}
              onConfirm={() => deleteTurn(latestTurn)}
              onPlay={() => playTurn(latestTurn)}
              onPlaySlow={() => playTurnSlow(latestTurn)}
              onFlip={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFlipped(!flipped);
              }}
              onCheck={() => startTeachBack(latestTurn)}
              onFullscreen={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFullscreenTurn(latestTurn);
              }}
            />
          </Appear>
        ) : null}

        {error ? (
          <Appear>
            <ErrorNotice
              primary={other[error]}
              secondary={en[error]}
              otherLanguage={otherLanguage}
              detail={setupError}
              onRetry={error === 'connectionError' && retryCtx ? retryLast : undefined}
              retryDisabled={phase !== 'idle'}
            />
          </Appear>
        ) : null}

        {phase === 'translating' ? (
          <Appear>
            <Translating stage={gateStage === 'checking' ? 'checking' : 'translating'} role={pendingRole} otherLanguage={otherLanguage} />
          </Appear>
        ) : null}

        {gateHeld ? (
          <Appear>
            <HeldNotice
              stage={gateHeld.stage}
              speaker={gateHeld.speaker}
              otherLanguage={otherLanguage}
              onSayAgain={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setGateHeld(null);
                startTap(gateHeld.speaker);
              }}
              onShowRights={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setGateHeld(null);
                blockStreakRef.current = 0;
                setRightsOpen(true);
              }}
            />
          </Appear>
        ) : null}

        {turns.length === 0 && !error && !setupError && phase === 'idle' ? (
          <Appear style={s.empty}>
            <Label {...bilingual(other.tagline, en.tagline)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="title" weight="semibold" align="center" />
            <Label {...bilingual(other.holdAndSpeak, en.holdAndSpeak)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} tone="ink2" align="center" />
          </Appear>
        ) : null}
      </ScrollView>

      {recordingPanelVisible ? (
        <Appear>
          <RecordingPanel
            speaker={speaker}
            otherLanguage={otherLanguage}
            elapsedMs={recorderState.durationMillis}
            level={meterLevel}
            tooQuiet={tooQuiet}
            onDone={() => void finishListening()}
            onCancel={() => void cancelListening()}
          />
        </Appear>
      ) : (
        <>
          <View style={s.tools}>
            <Button
              label={bilingual(other.quickPhrasesShort, en.quickPhrasesShort)}
              lang={otherLanguage.code}
              speechTag={otherLanguage.speechTag}
              variant="outline"
              stacked
              flex
              icon={<ChatIcon size={22} color={colors.ink} />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPhrasesOpen(true);
              }}
              disabled={busy}
              accessibilityLabel={`${other.quickPhrases}. ${en.quickPhrases}`}
            />
            <Button
              label={bilingual(other.typeLabel, en.typeLabel)}
              lang={otherLanguage.code}
              speechTag={otherLanguage.speechTag}
              variant="outline"
              stacked
              flex
              icon={<PencilIcon size={22} color={colors.ink} />}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNameMode(false);
                setTypeOpen(true);
              }}
              disabled={busy || offline}
            />
            <Button
              label={bilingual(other.scanLabel, en.scanLabel)}
              lang={otherLanguage.code}
              speechTag={otherLanguage.speechTag}
              variant="outline"
              stacked
              flex
              icon={<CameraIcon size={22} color={colors.ink} />}
              onPress={openScanner}
              disabled={busy || offline}
              accessibilityLabel={`${other.scanTitle}. ${en.scanTitle}`}
            />
          </View>

          <View style={s.speak}>
            {autoMode ? (
              <AutoSpeakButton otherLanguage={otherLanguage} disabled={phase === 'translating' || offline} onStart={() => startTap(null)} />
            ) : (
              <>
                <SpeakButton
                  language={ENGLISH}
                  disabled={phase === 'translating' || offline}
                  fill={colors.accent}
                  fillPressed={colors.accent}
                  onFill={colors.onAccent}
                  onStart={() => startTap(ENGLISH)}
                />
                <SpeakButton
                  language={otherLanguage}
                  disabled={phase === 'translating' || offline}
                  fill={colors.ink}
                  fillPressed={colors.ink}
                  onFill={colors.bg}
                  onStart={() => startTap(otherLanguage)}
                />
              </>
            )}
          </View>

          <Label {...bilingual(other.privacyLine, en.privacyLine)} lang={otherLanguage.code} speechTag={otherLanguage.speechTag} size="caption" tone="ink2" align="center" style={s.privacy} />
        </>
      )}

      <PhraseSheet
        visible={phrasesOpen}
        otherLanguage={otherLanguage}
        onClose={() => setPhrasesOpen(false)}
        onBodyMap={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Never dismiss one modal and present another in the same frame —
          // iOS drops the second present while the first animates out.
          setPhrasesOpen(false);
          if (modalSwapTimer.current) clearTimeout(modalSwapTimer.current);
          modalSwapTimer.current = setTimeout(() => setBodyMapOpen(true), 350);
        }}
        onPhrase={speakPhrase}
        onPain={speakPainNumber}
      />

      <TypeSheet
        visible={typeOpen}
        otherLanguage={otherLanguage}
        draft={typedDraft}
        onChangeDraft={setTypedDraft}
        nameMode={nameMode}
        onToggleNameMode={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setNameMode((v) => !v);
        }}
        onClose={() => setTypeOpen(false)}
        onSend={sendTypedText}
      />

      <TeachBackDialog
        teach={teach}
        otherLanguage={otherLanguage}
        onClose={closeTeach}
        onReplay={replayTeach}
        onAnswer={answerTeach}
        onShowRights={showRightsFromTeach}
      />

      <ScanSheet
        scan={scan}
        otherLanguage={otherLanguage}
        speakDisabled={phase !== 'idle'}
        onClose={closeScan}
        onRetry={() => {
          setScan(null);
          void openScanner();
        }}
        onSpeak={speakScan}
      />

      <BodyMapModal visible={bodyMapOpen} otherLanguage={otherLanguage} onClose={() => setBodyMapOpen(false)} onConfirm={confirmBodyPain} />
      <RightsCard visible={rightsOpen} otherLanguage={otherLanguage} onClose={() => setRightsOpen(false)} />
      <SummaryModal state={summary} otherLanguage={otherLanguage} onClose={() => setSummary(null)} />
      <FullscreenTranslation
        text={fullscreenTurn?.translation ?? null}
        language={fullscreenTurn?.listener ?? null}
        otherLanguage={otherLanguage}
        onClose={() => setFullscreenTurn(null)}
      />
    </View>
  );
}

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, paddingHorizontal: spacing.md },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
    headerLanguage: { flex: 1, justifyContent: 'flex-start', paddingHorizontal: spacing.xs },
    iconButton: { width: tapTarget.min, height: tapTarget.min, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control },
    disabled: { opacity: 0.4 },
    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: c.surface,
      borderRadius: radius.control,
      padding: spacing.sm,
    },
    bannerText: { flex: 1, gap: spacing.xs },
    disclaimer: { gap: spacing.xs, marginTop: spacing.xs },
    disclaimerOk: { alignSelf: 'stretch' },
    summary: { marginTop: spacing.sm, alignSelf: 'stretch' },
    thread: { flex: 1 },
    threadContent: { paddingVertical: spacing.md, gap: spacing.md },
    threadEmpty: { flexGrow: 1, justifyContent: 'flex-end' },
    live: { marginTop: spacing.sm },
    empty: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    tools: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
    speak: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    privacy: { alignSelf: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  });
