import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AudioModule,
  createAudioPlayer,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useNetworkState } from 'expo-network';
import * as Speech from 'expo-speech';
import { AlertCircleIcon, ArrowDownIcon, ArrowForwardIcon, BodyIcon, BrandGlyph, CameraIcon, ChatIcon, CheckIcon, ChevronForwardIcon, CloseIcon, CloudOffIcon, DocumentIcon, ExpandIcon, EyeIcon, InfoIcon, LanguageIcon, LockIcon, MedkitIcon, MegaphoneIcon, PencilIcon, PeopleIcon, PersonIcon, RefreshIcon, ShieldIcon, SlowIcon, SparkleIcon, SpeakIcon, SpeakingArc, TwoVoicesScene, UnderstandIcon } from '../components/icons';

import { BODY_REGIONS, type BodyRegionId } from '../config/bodyRegions';
import { ENGLISH, type Language } from '../config/languages';
import { CLINICIAN_PHRASES, EMERGENCY_PHRASES, PATIENT_PHRASES, type Phrase } from '../config/phrases';
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
  type MedLabelResult,
} from '../services/openai';
import { playStopChime, releaseChimes } from '../services/chimes';
import { loadPrefs, savePrefs } from '../services/storage';
import { colors, displayFontFor, fonts, MIN_TARGET, radius, shadows, spacing, type } from '../theme';
import { Appear } from '../components/Appear';
import { BodyMapModal } from '../components/BodyMap';
import { FullscreenTranslation } from '../components/FullscreenTranslation';
import { LevelMeter } from '../components/LevelMeter';
import { PressableScale } from '../components/PressableScale';
import { Pulse } from '../components/Pulse';
import { RightsCard } from '../components/RightsCard';
import { SummaryModal, type SummaryState } from '../components/SummaryModal';
import { TurnSkeleton } from '../components/Skeleton';
import { AutoSpeakButton, SpeakButton } from '../components/SpeakButton';

type Phase = 'idle' | 'listening' | 'translating' | 'speaking';

export interface Turn {
  id: number;
  original: string;
  translation: string;
  speaker: Language;
  listener: Language;
  /** A verbatim name entry (no translation): renders as a single-name card. */
  isName?: boolean;
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

const formatElapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The conversation screen — where 95% of usage happens. Two big buttons, one
 * per language (or a single auto-detect button). One tap starts recording;
 * the bottom of the screen becomes a recording panel (elapsed time, a live
 * mic meter, one giant Done button) so nothing needs to be held and nothing
 * needs precision. The running thread makes the back-and-forth visible;
 * nothing is ever written to disk.
 */
export function ConversationScreen({ otherLanguage, turns, onTurnsChange, onChangeLanguage, onShowAbout }: Props) {
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
  /** Dev-only: last recording's actual audio length (Whisper-measured), to
   * confirm the recording is not being cut short. */
  const [devAudioLen, setDevAudioLen] = useState<number | null>(null);
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
  /** Interpreter-rights card — reachable from the teach-back dead end. */
  const [rightsOpen, setRightsOpen] = useState(false);

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
   * window usePhrase uses). */
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

  /** Transcribe → translate → speak. Shared by the normal flow and "Try again". */
  const processRecording = async (uri: string, who: Language | null) => {
    setPhase('translating');
    setError(null);
    try {
      const { text, detectedCode, lowConfidence, durationSec } = await transcribe(uri, who);
      // Dev diagnostic: the actual captured audio length. If this is ~1s while
      // you spoke for several, the recording is being cut short (not Whisper).
      if (__DEV__) setDevAudioLen(durationSec);
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
      const translation = await translate(text, speakerLang, listener);

      const turn: Turn = { id: Date.now(), original: text, translation, speaker: speakerLang, listener };
      addTurn(turn);
      setRetryCtx(null);
      // The turn is safely in memory — the audio file has served its purpose.
      discardRecordingFile(uri);
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
      player.addListener('playbackStatusUpdate', (status) => {
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

  /** Translate + speak typed text — the fallback for loud rooms or a failing mic. */
  const useTypedText = async (who: Language) => {
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
      const translation = await translate(text, who, listener);
      const turn: Turn = { id: Date.now(), original: text, translation, speaker: who, listener };
      addTurn(turn);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await speak(translation, listener, turn.id);
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
  const usePainNumber = async (n: number) => {
    const phrase: Phrase = {
      id: `pain-${n}`,
      icon: 'speedometer-outline',
      text: Object.fromEntries(
        ['en', otherLanguage.code].map((code) => [code, t(code).painIs.replace('{n}', String(n))]),
      ),
    };
    await usePhrase(phrase, otherLanguage);
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
      setSummary({ status: 'ready', text: `${text}\n\n${other.aiDisclaimer}\n${en.aiDisclaimer}` });
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

  /** Recording-panel strings: the speaker's own language, English secondary.
   * Auto mode (speaker unknown) falls back to the bilingual pair. */
  const rec = speaker ? t(speaker.code) : other;

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
          <LanguageIcon  size={20} color={colors.textMuted} />
          <View>
            <Text style={styles.headerChipText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {other.languageShort}
            </Text>
            <Text style={styles.headerChipTextEn} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {en.languageShort}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onShowAbout}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${other.about} — ${en.about}`}
          style={({ pressed }) => [styles.headerChip, pressed && styles.pressedDim, busy && styles.dimmed]}
        >
          <InfoIcon  size={20} color={colors.textMuted} />
          <View>
            <Text style={styles.headerChipText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {other.aboutShort}
            </Text>
            <Text style={styles.headerChipTextEn} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {en.aboutShort}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Offline: a calm heads-up, not an alarm — and a pointer to what still works. */}
      {offline ? (
        <Appear style={styles.offlineBanner} accessibilityLiveRegion="polite">
          <CloudOffIcon  size={22} color={colors.textMuted} />
          <View style={styles.offlineBody}>
            <Text
              style={styles.offlineText}
              accessibilityLanguage={otherLanguage.speechTag}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
            >
              {other.offlineLine}
            </Text>
            <Text style={styles.offlineTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>
              {en.offlineLine}
            </Text>
          </View>
        </Appear>
      ) : null}

      {/* First-session honesty banner: AI translation has limits. It yields
         while recording — the tall banner would otherwise push the Done
         button off a 375×812 screen on a first-run recording. */}
      {showDisclaimer && !recordingPanelVisible ? (
        <View style={styles.disclaimer}>
          <InfoIcon  size={22} color={colors.secondary} />
          <View style={styles.disclaimerBody}>
            <Text
              style={styles.disclaimerText}
              accessibilityLanguage={otherLanguage.speechTag}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
            >
              {other.aiDisclaimer}
            </Text>
            <Text style={styles.disclaimerTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>
              {en.aiDisclaimer}
            </Text>
            <Text
              style={styles.disclaimerText}
              accessibilityLanguage={otherLanguage.speechTag}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
            >
              {other.dataConsent}
            </Text>
            <Text style={styles.disclaimerTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>
              {en.dataConsent}
            </Text>
          </View>
          <Pressable
            onPress={dismissDisclaimer}
            accessibilityRole="button"
            accessibilityLabel={`${other.ok} — ${en.ok}`}
            style={({ pressed }) => [styles.disclaimerOk, pressed && styles.pressedDim]}
          >
            <Text style={styles.disclaimerOkText} allowFontScaling maxFontSizeMultiplier={1.3}>
              {other.ok === en.ok ? en.ok : `${other.ok} · ${en.ok}`}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* F3: the visit summary pill — appears once there is enough to summarize. */}
      {turns.length >= 2 ? (
        <View style={styles.summaryRow}>
          <PressableScale
            onPress={() => openSummary(turns)}
            disabled={busy || offline}
            accessibilityRole="button"
            accessibilityLabel={`${other.summary} — ${en.summary}`}
            style={[styles.summaryPill, (busy || offline) && styles.dimmed]}
          >
            <DocumentIcon  size={18} color={colors.primary} />
            <Text style={styles.summaryPillText} allowFontScaling maxFontSizeMultiplier={1.3}>
              {other.summary === en.summary ? en.summary : `${other.summary} · ${en.summary}`}
            </Text>
          </PressableScale>
        </View>
      ) : null}

      {/* The conversation thread. */}
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={[styles.threadContent, turns.length === 0 && styles.threadEmpty]}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {__DEV__ && devAudioLen != null ? (
          <Text style={styles.meterDebug}>{`last recording: ${devAudioLen.toFixed(1)}s of audio`}</Text>
        ) : null}
        {turns.map((turn) => {
          const isLatest = turn.id === latestTurn?.id;
          const fromEnglish = turn.speaker.code === 'en';
          // Latest clinician turns carry three actions — too many for one row
          // at 375pt, so the play pill gets its own row and the other two share.
          // Name cards get neither flip nor teach-back — just play again.
          const hasCheck = isLatest && fromEnglish && !turn.isName;
          const flipPill = isLatest && !turn.isName ? (
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
              <EyeIcon  size={20} color={colors.primary} />
              <View style={styles.turnButtonLabels}>
                <Text style={styles.turnButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                  {t(turn.listener.code).flip}
                </Text>
                {turn.listener.code !== 'en' ? (
                  <Text style={styles.turnButtonTextEn} allowFontScaling maxFontSizeMultiplier={2}>
                    {en.flip}
                  </Text>
                ) : null}
              </View>
            </PressableScale>
          ) : null;
          return (
            <Appear
              key={turn.id}
              style={[
                styles.turnCard,
                fromEnglish ? styles.turnLeft : styles.turnRight,
                isLatest && styles.turnLatest,
                isLatest && (fromEnglish ? styles.turnLatestLeft : styles.turnLatestRight),
              ]}
            >
              <View style={styles.speakerRow}>
                <View
                  style={[styles.monogramChip, !fromEnglish && styles.monogramChipSecondary]}
                  importantForAccessibility="no"
                >
                  <Text style={[styles.monogramText, !fromEnglish && styles.monogramTextSecondary]} allowFontScaling maxFontSizeMultiplier={1.2}>
                    {turn.speaker.monogram}
                  </Text>
                </View>
                <Text style={styles.originalLabel} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={turn.speaker.speechTag}>
                  {turn.isName ? `${t(turn.speaker.code).nameLabel} · ${en.nameLabel}` : t(turn.speaker.code).youSaid}
                </Text>
              </View>
              {turn.original ? (
                <Text style={styles.originalText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={turn.speaker.speechTag}>
                  {turn.original}
                </Text>
              ) : null}

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFullscreenTurn(turn);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${t(turn.listener.code).fullscreen} — ${en.fullscreen}`}
                style={({ pressed }) => [
                  styles.translationBlock,
                  flipped && isLatest && styles.flippedBlock,
                  pressed && styles.pressedDim,
                ]}
              >
                <View style={styles.translationLabelRow}>
                  {turn.isName ? (
                    <View />
                  ) : (
                    <View style={styles.translationLabelWrap}>
                      {/* The sound arc on the live turn — it ripples while
                         this line is actually being spoken aloud. */}
                      {isLatest ? (
                        <SpeakingArc size={14} color={colors.accent} active={phase === 'speaking'} />
                      ) : null}
                      <Text style={styles.translationLabel} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={turn.listener.speechTag}>
                        {t(turn.listener.code).translationLabel}
                      </Text>
                    </View>
                  )}
                  <ExpandIcon size={16} color={colors.textFaint} importantForAccessibility="no" />
                </View>
                <Text
                  style={isLatest ? styles.translationText : styles.translationTextOld}
                  accessibilityLanguage={turn.listener.speechTag}
                  accessibilityLiveRegion={isLatest ? 'polite' : 'none'}
                >
                  {turn.translation}
                </Text>
              </Pressable>

              <View style={styles.turnActionsWrap}>
                <View style={styles.turnActions}>
                  <PressableScale
                    onPress={() => playTurn(turn)}
                    disabled={phase !== 'idle'}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(turn.listener.code).playAgain} — ${en.playAgain}`}
                    flexFill
                    style={[styles.turnButton, phase !== 'idle' && !(isLatest && phase === 'speaking') && styles.dimmed]}
                  >
                    <SpeakIcon  size={20} color={colors.primary} />
                    <View style={styles.turnButtonLabels}>
                      <Text style={styles.turnButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                        {isLatest && phase === 'speaking'
                          ? t(turn.listener.code).playing
                          : t(turn.listener.code).playAgain}
                      </Text>
                      {turn.listener.code !== 'en' ? (
                        <Text style={styles.turnButtonTextEn} allowFontScaling maxFontSizeMultiplier={2}>
                          {isLatest && phase === 'speaking' ? en.playing : en.playAgain}
                        </Text>
                      ) : null}
                    </View>
                  </PressableScale>
                  <PressableScale
                    onPress={() => playTurnSlow(turn)}
                    disabled={phase !== 'idle'}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(turn.listener.code).slowLabel} — ${en.slowLabel}`}
                    flexFill
                    style={[styles.turnButton, phase !== 'idle' && styles.dimmed]}
                  >
                    <SlowIcon  size={20} color={colors.primary} />
                    <View style={styles.turnButtonLabels}>
                      <Text style={styles.turnButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                        {t(turn.listener.code).slowLabel}
                      </Text>
                      {turn.listener.code !== 'en' ? (
                        <Text style={styles.turnButtonTextEn} allowFontScaling maxFontSizeMultiplier={2}>
                          {en.slowLabel}
                        </Text>
                      ) : null}
                    </View>
                  </PressableScale>
                </View>
                {isLatest && !turn.isName && (
                  <View style={styles.turnActions}>
                    {flipPill}
                    {hasCheck ? (
                      <PressableScale
                        onPress={() => startTeachBack(turn)}
                        disabled={phase !== 'idle' || offline}
                        accessibilityRole="button"
                        accessibilityLabel={`${other.checkLabel} — ${en.checkLabel}`}
                        flexFill
                        style={[styles.turnButton, (phase !== 'idle' || offline) && styles.dimmed]}
                      >
                        <UnderstandIcon  size={20} color={colors.primary} />
                        <View style={styles.turnButtonLabels}>
                          <Text style={styles.turnButtonText} allowFontScaling maxFontSizeMultiplier={2}>
                            {other.checkLabel}
                          </Text>
                          <Text style={styles.turnButtonTextEn} allowFontScaling maxFontSizeMultiplier={2}>
                            {en.checkLabel}
                          </Text>
                        </View>
                      </PressableScale>
                    ) : null}
                  </View>
                )}
              </View>
            </Appear>
          );
        })}

        {error ? (
          <Appear style={styles.errorCard} accessibilityLiveRegion="assertive">
            <AlertCircleIcon  size={26} color={colors.dangerText} />
            <View style={styles.errorBody}>
              <Text style={styles.errorText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                {other[error]}
              </Text>
              <Text style={styles.errorTextSmall} allowFontScaling maxFontSizeMultiplier={2}>{en[error]}</Text>
              {__DEV__ && setupError ? <Text style={styles.errorDetail} allowFontScaling maxFontSizeMultiplier={2}>{setupError}</Text> : null}
              {error === 'connectionError' && retryCtx ? (
                <PressableScale
                  onPress={retryLast}
                  disabled={phase !== 'idle'}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.tryAgain} — ${en.tryAgain}`}
                  style={[styles.retryButton, phase !== 'idle' && styles.dimmed]}
                >
                  <RefreshIcon  size={20} color={colors.dangerText} />
                  <Text style={styles.retryText} allowFontScaling maxFontSizeMultiplier={2}>
                    {other.tryAgain} · {en.tryAgain}
                  </Text>
                </PressableScale>
              ) : null}
            </View>
          </Appear>
        ) : null}

        {phase === 'translating' ? (
          <Appear style={styles.pendingWrap}>
            <TurnSkeleton alignRight={speaker != null && speaker.code !== 'en'} />
            <View style={styles.pendingCaption} accessibilityLiveRegion="polite">
              <Text style={styles.pendingText} allowFontScaling maxFontSizeMultiplier={2}>{other.translating}</Text>
              <Text style={styles.pendingTextSmall} allowFontScaling maxFontSizeMultiplier={2}>{en.translating}</Text>
            </View>
          </Appear>
        ) : null}

        {turns.length === 0 && !error && !setupError && phase === 'idle' ? (
          <Appear style={styles.hint}>
            {/* The disclaimer banner already fills the top of a first-run
               screen — drop the decorative mic circle so the instruction and
               its arrow stay above the fold. */}
            {!showDisclaimer ? (
              /* Two capsule figures, the sound arc between them — the promise
                 as a picture: two people, two languages, one conversation. */
              <TwoVoicesScene width={272} style={styles.hintScene} />
            ) : null}
            {/* The promise first, in the patient's own language — then how. */}
            <Text
              style={[styles.hintTagline, { fontFamily: displayFontFor(otherLanguage.code) }]}
              accessibilityLanguage={otherLanguage.speechTag}
              allowFontScaling
              maxFontSizeMultiplier={2}
            >
              {other.tagline}
            </Text>
            <Text style={styles.hintTaglineEn} allowFontScaling maxFontSizeMultiplier={2}>
              {en.tagline}
            </Text>
            <Text
              style={styles.hintText}
              accessibilityLanguage={otherLanguage.speechTag}
              allowFontScaling
              maxFontSizeMultiplier={2}
            >
              {other.holdAndSpeak}
            </Text>
            <Text style={styles.hintTextSmall} allowFontScaling maxFontSizeMultiplier={2}>{en.holdAndSpeak}</Text>
            <ArrowDownIcon  size={30} color={colors.accent} style={styles.hintArrow} />
          </Appear>
        ) : null}
      </ScrollView>

      {recordingPanelVisible ? (
        /* While recording, the bottom of the screen becomes one thing: the
         * phone is visibly a microphone. Elapsed time, a live level meter,
         * and a giant Done button — no tools, no clutter, no precision. */
        <Appear style={styles.recordPanel}>
          <View style={styles.recordStatus} accessibilityLiveRegion="polite">
            <Pulse color={colors.listening} size={36} />
            <Text style={styles.recordTimer} allowFontScaling maxFontSizeMultiplier={1.3}>
              {formatElapsed(recorderState.durationMillis)}
            </Text>
          </View>
          <Text
            style={styles.recordLabel}
            accessibilityLanguage={speaker?.speechTag}
            allowFontScaling
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {speaker ? rec.listening : `${other.listening} · ${en.listening}`}
          </Text>

          <LevelMeter level={meterLevel} />

          {__DEV__ ? (
            <Text style={styles.meterDebug}>
              {`raw metering: ${
                typeof recorderState.metering === 'number' ? recorderState.metering.toFixed(1) : 'undefined'
              }  →  level ${meterLevel == null ? 'null' : meterLevel.toFixed(2)}`}
            </Text>
          ) : null}

          {/* Fixed-height slot so the nudge appearing never shifts the Done button. */}
          <View style={styles.nudgeSlot} accessibilityLiveRegion="polite">
            {tooQuiet ? (
              <>
                <Text style={styles.nudgeText} accessibilityLanguage={speaker?.speechTag}>
                  {rec.speakLouder}
                </Text>
                {rec.speakLouder !== en.speakLouder ? (
                  <Text style={styles.nudgeTextEn}>{en.speakLouder}</Text>
                ) : null}
              </>
            ) : null}
          </View>

          <PressableScale
            onPress={() => void finishListening()}
            accessibilityRole="button"
            accessibilityLabel={`${rec.doneLabel} — ${en.doneLabel}`}
            accessibilityHint={`${rec.tapWhenDone} — ${en.tapWhenDone}`}
            style={styles.doneOuter}
          >
            {({ pressed }) => (
              <View style={[styles.doneInner, pressed && styles.doneInnerPressed]}>
                <CheckIcon  size={44} color={colors.onPrimary} />
                <View style={styles.doneLabels}>
                  <Text
                    style={styles.doneText}
                    accessibilityLanguage={speaker?.speechTag}
                    allowFontScaling
                    maxFontSizeMultiplier={1.3}
                  >
                    {rec.doneLabel}
                  </Text>
                  {rec.doneLabel !== en.doneLabel ? (
                    <Text style={styles.doneTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>
                      {en.doneLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </PressableScale>

          <Pressable
            onPress={() => void cancelListening()}
            accessibilityRole="button"
            accessibilityLabel={`${rec.cancel} — ${en.cancel}`}
            style={({ pressed }) => [styles.cancelLink, pressed && styles.pressedDim]}
          >
            <Text style={styles.cancelText} allowFontScaling maxFontSizeMultiplier={1.3}>
              {rec.cancel === en.cancel ? en.cancel : `${rec.cancel} · ${en.cancel}`}
            </Text>
          </Pressable>
        </Appear>
      ) : (
        <>
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
          <ChatIcon  size={20} color={colors.text} />
          <View style={styles.toolButtonLabels}>
            <Text style={styles.toolButtonText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {other.quickPhrasesShort}
            </Text>
            <Text style={styles.toolButtonTextEn} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {en.quickPhrasesShort}
            </Text>
          </View>
        </PressableScale>
        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setNameMode(false);
            setTypeOpen(true);
          }}
          disabled={busy || offline}
          accessibilityRole="button"
          accessibilityLabel={`${other.typeLabel} — ${en.typeLabel}`}
          flexFill
          style={[styles.toolButton, (busy || offline) && styles.dimmed]}
        >
          <PencilIcon  size={20} color={colors.text} />
          <View style={styles.toolButtonLabels}>
            <Text style={styles.toolButtonText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {other.typeLabel}
            </Text>
            <Text style={styles.toolButtonTextEn} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {en.typeLabel}
            </Text>
          </View>
        </PressableScale>
        <PressableScale
          onPress={openScanner}
          disabled={busy || offline}
          accessibilityRole="button"
          accessibilityLabel={`${other.scanTitle} — ${en.scanTitle}`}
          flexFill
          style={[styles.toolButton, (busy || offline) && styles.dimmed]}
        >
          <CameraIcon  size={20} color={colors.text} />
          <View style={styles.toolButtonLabels}>
            <Text style={styles.toolButtonText} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {other.scanLabel}
            </Text>
            <Text style={styles.toolButtonTextEn} allowFontScaling maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {en.scanLabel}
            </Text>
          </View>
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
          <SparkleIcon  size={18} color={autoMode ? colors.primary : colors.text} />
          <View style={styles.toolButtonLabels}>
            <Text
              style={[styles.toolButtonText, autoMode && styles.toolButtonTextOn]}
              allowFontScaling
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {other.auto}
            </Text>
            {other.auto !== en.auto ? (
              <Text
                style={[styles.toolButtonTextEn, autoMode && styles.toolButtonTextOn]}
                allowFontScaling
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {en.auto}
              </Text>
            ) : null}
          </View>
        </PressableScale>
      </View>

      {/* The speak buttons: two per-language buttons, or one auto-detect button. */}
      <View style={styles.buttons}>
        {autoMode ? (
          <AutoSpeakButton
            otherLanguage={otherLanguage}
            disabled={phase === 'translating' || offline}
            onStart={() => startTap(null)}
          />
        ) : (
          <>
            <SpeakButton
              language={ENGLISH}
              disabled={phase === 'translating' || offline}
              fill={colors.primary}
              fillPressed={colors.primaryPressed}
              onStart={() => startTap(ENGLISH)}
            />
            <SpeakButton
              language={otherLanguage}
              disabled={phase === 'translating' || offline}
              fill={colors.secondary}
              fillPressed={colors.secondaryPressed}
              onStart={() => startTap(otherLanguage)}
            />
          </>
        )}
      </View>

      {/* Trust cue, in both active languages. */}
      <View style={styles.privacy}>
        <View style={styles.privacyRow}>
          <LockIcon  size={13} color={colors.textFaint} />
          <Text style={styles.privacyText} allowFontScaling maxFontSizeMultiplier={1.2}>
            {other.privacyLine}
          </Text>
        </View>
        <Text style={styles.privacyText} allowFontScaling maxFontSizeMultiplier={1.2}>
          {en.privacyLine}
        </Text>
      </View>
        </>
      )}

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
            accessibilityRole="button"
            accessibilityLabel={`${other.close} — ${en.close}`}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} importantForAccessibility="no" />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <ChatIcon  size={24} color={colors.primary} />
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetTitle} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header" accessibilityLanguage={otherLanguage.speechTag}>
                    {other.quickPhrases}
                  </Text>
                  <Text style={styles.sheetTitleEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.quickPhrases}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setPhrasesOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={`${other.close} — ${en.close}`}
                style={({ pressed }) => [styles.sheetClose, pressed && styles.pressedDim]}
              >
                <CloseIcon  size={22} color={colors.primary} />
                <Text style={styles.sheetCloseText} allowFontScaling maxFontSizeMultiplier={1.3}>
                  {other.close} · {en.close}
                </Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              {/* F4 entry: the body-map hero card. */}
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Never dismiss one modal and present another in the same
                  // frame — iOS drops the second present while the first is
                  // still animating out. Close, let the dismissal settle, open.
                  setPhrasesOpen(false);
                  if (modalSwapTimer.current) clearTimeout(modalSwapTimer.current);
                  modalSwapTimer.current = setTimeout(() => setBodyMapOpen(true), 350);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${other.whereHurts} — ${en.whereHurts}`}
                style={styles.bodyMapCard}
              >
                <View style={styles.bodyMapIcon} importantForAccessibility="no">
                  <BodyIcon  size={30} color={colors.onPrimary} />
                </View>
                <View style={styles.bodyMapTextWrap}>
                  <Text style={styles.bodyMapTitle} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.whereHurts}
                  </Text>
                  <Text style={styles.bodyMapSub} allowFontScaling maxFontSizeMultiplier={1.3}>{en.whereHurts}</Text>
                </View>
                <ChevronForwardIcon  size={26} color={colors.onPrimary} importantForAccessibility="no" />
              </PressableScale>

              <Text style={[styles.sheetSection, styles.sheetSectionUrgent]} allowFontScaling maxFontSizeMultiplier={2} importantForAccessibility="no">
                {other.emergency} · {en.emergency}
              </Text>
              {EMERGENCY_PHRASES.map((phrase) => (
                <PressableScale
                  key={phrase.id}
                  onPress={() => usePhrase(phrase, otherLanguage)}
                  accessibilityRole="button"
                  accessibilityLabel={phrase.text[otherLanguage.code]}
                  accessibilityLanguage={otherLanguage.speechTag}
                  style={styles.phraseRow}
                >
                  <View style={[styles.phraseIconCircle, styles.phraseIconCircleUrgent]} importantForAccessibility="no">
                    <BrandGlyph name={phrase.icon} size={24} color={colors.dangerText} />
                  </View>
                  <View style={styles.phraseTextWrap}>
                    <Text style={styles.phrasePrimary} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                      {phrase.text[otherLanguage.code]}
                    </Text>
                    <Text style={styles.phraseSecondary} allowFontScaling maxFontSizeMultiplier={2}>{phrase.text.en}</Text>
                  </View>
                  <SpeakIcon  size={22} color={colors.textFaint} />
                </PressableScale>
              ))}

              <Text style={styles.sheetSection} allowFontScaling maxFontSizeMultiplier={2} importantForAccessibility="no">
                {other.painScaleLabel} · {en.painScaleLabel}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.painRow}
              >
                {Array.from({ length: 11 }, (_, n) => (
                  <PressableScale
                    key={n}
                    onPress={() => usePainNumber(n)}
                    accessibilityRole="button"
                    accessibilityLabel={other.painIs.replace('{n}', String(n))}
                    accessibilityLanguage={otherLanguage.speechTag}
                    style={[styles.painChip, n >= 7 && styles.painChipHigh]}
                  >
                    <Text style={[styles.painChipText, n >= 7 && styles.painChipTextHigh]} allowFontScaling maxFontSizeMultiplier={1.4}>{n}</Text>
                  </PressableScale>
                ))}
              </ScrollView>

              <Text style={styles.sheetSection} allowFontScaling maxFontSizeMultiplier={2} importantForAccessibility="no">
                {ENGLISH.nativeName} → {otherLanguage.nativeName}
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
                    <BrandGlyph name={phrase.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.phraseTextWrap}>
                    <Text style={styles.phrasePrimary} allowFontScaling maxFontSizeMultiplier={2}>{phrase.text.en}</Text>
                    <Text style={styles.phraseSecondary} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                      {phrase.text[otherLanguage.code]}
                    </Text>
                  </View>
                  <SpeakIcon  size={22} color={colors.textFaint} />
                </PressableScale>
              ))}

              <Text style={styles.sheetSection} allowFontScaling maxFontSizeMultiplier={2} importantForAccessibility="no">
                {otherLanguage.nativeName} → {ENGLISH.nativeName}
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
                    <BrandGlyph name={phrase.icon} size={24} color={colors.secondary} />
                  </View>
                  <View style={styles.phraseTextWrap}>
                    <Text style={styles.phrasePrimary} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                      {phrase.text[otherLanguage.code]}
                    </Text>
                    <Text style={styles.phraseSecondary} allowFontScaling maxFontSizeMultiplier={2}>{phrase.text.en}</Text>
                  </View>
                  <SpeakIcon  size={22} color={colors.textFaint} />
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Typed-text fallback: for loud rooms or when the mic fails. */}
      <Modal visible={typeOpen} animationType="slide" transparent onRequestClose={() => setTypeOpen(false)}>
        <KeyboardAvoidingView
          style={styles.sheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.sheetDismiss}
            onPress={() => setTypeOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={`${other.close} — ${en.close}`}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} importantForAccessibility="no" />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <PencilIcon  size={24} color={colors.primary} />
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetTitle} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header" accessibilityLanguage={otherLanguage.speechTag}>
                    {other.typeLabel}
                  </Text>
                  <Text style={styles.sheetTitleEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.typeLabel}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setTypeOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={`${other.close} — ${en.close}`}
                style={({ pressed }) => [styles.sheetClose, pressed && styles.pressedDim]}
              >
                <CloseIcon  size={22} color={colors.primary} />
                <Text style={styles.sheetCloseText} allowFontScaling maxFontSizeMultiplier={1.3}>
                  {other.close} · {en.close}
                </Text>
              </Pressable>
            </View>
            <View style={styles.typeContent}>
              {/* Name mode: enter a person's name verbatim (never translated) —
                 the reliable path for names the mic can't capture. */}
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNameMode((v) => !v);
                }}
                accessibilityRole="switch"
                accessibilityState={{ checked: nameMode }}
                accessibilityLabel={`${other.nameLabel} — ${en.nameLabel}. ${other.nameHint}`}
                style={[styles.nameToggle, nameMode && styles.nameToggleOn]}
              >
                <PersonIcon
                  size={20}
                  color={nameMode ? colors.primary : colors.textMuted}
                />
                <View style={styles.nameToggleLabels}>
                  <Text style={[styles.nameToggleText, nameMode && styles.nameToggleTextOn]} allowFontScaling maxFontSizeMultiplier={1.3}>
                    {other.nameLabel} · {en.nameLabel}
                  </Text>
                  <Text style={styles.nameToggleHint} allowFontScaling maxFontSizeMultiplier={1.3}>
                    {nameMode ? `${other.nameHint} · ${en.nameHint}` : `${other.typeLabel} · ${en.typeLabel}`}
                  </Text>
                </View>
                <View style={[styles.nameCheck, nameMode && styles.nameCheckOn]}>
                  {nameMode ? <CheckIcon  size={16} color={colors.onPrimary} /> : null}
                </View>
              </PressableScale>
              <TextInput
                value={typedDraft}
                onChangeText={setTypedDraft}
                placeholder={
                  nameMode
                    ? `${other.namePlaceholder} · ${en.namePlaceholder}`
                    : `${other.typePlaceholder} · ${en.typePlaceholder}`
                }
                placeholderTextColor={colors.textFaint}
                multiline={!nameMode}
                autoFocus
                autoCapitalize={nameMode ? 'words' : 'sentences'}
                autoCorrect={!nameMode}
                accessibilityLabel={
                  nameMode ? `${other.nameLabel} — ${en.nameLabel}` : `${other.typeLabel} — ${en.typeLabel}`
                }
                style={styles.typeInput}
              />
              <View style={styles.typeSendRow}>
                <PressableScale
                  onPress={() => useTypedText(ENGLISH)}
                  disabled={!typedDraft.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="English"
                  flexFill
                  style={[styles.typeSend, { backgroundColor: colors.primary }, !typedDraft.trim() && styles.dimmed]}
                >
                  <Text style={styles.typeSendText} allowFontScaling maxFontSizeMultiplier={1.3}>{ENGLISH.nativeName}</Text>
                  <ArrowForwardIcon  size={20} color={colors.onPrimary} />
                </PressableScale>
                <PressableScale
                  onPress={() => useTypedText(otherLanguage)}
                  disabled={!typedDraft.trim()}
                  accessibilityRole="button"
                  accessibilityLabel={otherLanguage.nativeName}
                  accessibilityLanguage={otherLanguage.speechTag}
                  flexFill
                  style={[styles.typeSend, { backgroundColor: colors.secondary }, !typedDraft.trim() && styles.dimmed]}
                >
                  <Text style={styles.typeSendText} allowFontScaling maxFontSizeMultiplier={1.3}>{otherLanguage.nativeName}</Text>
                  <ArrowForwardIcon  size={20} color={colors.onPrimary} />
                </PressableScale>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* F2: teach-back — did the patient really understand? */}
      {teach ? (
        <Modal visible transparent animationType="fade" onRequestClose={closeTeach}>
          <View style={styles.centerBackdrop}>
            <View style={styles.teachCard}>
              <Pressable
                onPress={closeTeach}
                accessibilityRole="button"
                accessibilityLabel={`${other.close} — ${en.close}`}
                style={({ pressed }) => [styles.teachClose, pressed && styles.pressedDim]}
              >
                <CloseIcon  size={24} color={colors.textMuted} />
              </Pressable>

              {teach.stage === 'loading' || teach.stage === 'loading2' ? (
                <View style={styles.teachCenter} accessibilityLiveRegion="polite">
                  <UnderstandIcon  size={34} color={colors.primary} />
                  <Text style={styles.teachQuestion} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.simplifying}
                  </Text>
                  <Text style={styles.teachSub} allowFontScaling maxFontSizeMultiplier={2}>{en.simplifying}</Text>
                </View>
              ) : null}

              {teach.stage === 'ask' || teach.stage === 'ask2' ? (
                <>
                  {teach.stage === 'ask2' ? (
                    <View style={styles.teachBanner}>
                      <MegaphoneIcon  size={20} color={colors.secondary} />
                      <Text style={styles.teachBannerText} allowFontScaling maxFontSizeMultiplier={2}>{en.explainAgain}</Text>
                    </View>
                  ) : null}
                  <Text
                    style={styles.teachExplanation} allowFontScaling maxFontSizeMultiplier={2}
                    accessibilityLanguage={otherLanguage.speechTag}
                    accessibilityLiveRegion="polite"
                  >
                    {teach.text}
                  </Text>
                  <PressableScale
                    onPress={replayTeach}
                    accessibilityRole="button"
                    accessibilityLabel={`${other.playAgain} — ${en.playAgain}`}
                    style={styles.teachReplay}
                  >
                    <SpeakIcon  size={18} color={colors.primary} />
                    <Text style={styles.teachReplayText} allowFontScaling maxFontSizeMultiplier={2}>
                      {other.playAgain} · {en.playAgain}
                    </Text>
                  </PressableScale>
                  <Text style={styles.teachQuestion} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.didYouUnderstand}
                  </Text>
                  <Text style={styles.teachSub} allowFontScaling maxFontSizeMultiplier={2}>{en.didYouUnderstand}</Text>
                  <View style={styles.teachChoices}>
                    <PressableScale
                      onPress={() => answerTeach(true)}
                      accessibilityRole="button"
                      accessibilityLabel={`${other.yes} — ${en.yes}`}
                      flexFill
                      style={[styles.teachChoice, styles.teachYes]}
                    >
                      <CheckIcon  size={36} color={colors.onPrimary} />
                      <Text style={styles.teachChoiceText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                        {other.yes}
                      </Text>
                      {other.yes !== en.yes ? <Text style={styles.teachChoiceTextEn} allowFontScaling maxFontSizeMultiplier={2}>{en.yes}</Text> : null}
                    </PressableScale>
                    <PressableScale
                      onPress={() => answerTeach(false)}
                      accessibilityRole="button"
                      accessibilityLabel={`${other.no} — ${en.no}`}
                      flexFill
                      style={[styles.teachChoice, styles.teachNo]}
                    >
                      <CloseIcon  size={36} color={colors.onPrimary} />
                      <Text style={styles.teachChoiceText} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                        {other.no}
                      </Text>
                      {other.no !== en.no ? <Text style={styles.teachChoiceTextEn} allowFontScaling maxFontSizeMultiplier={2}>{en.no}</Text> : null}
                    </PressableScale>
                  </View>
                </>
              ) : null}

              {teach.stage === 'failed' ? (
                <View style={styles.teachCenter}>
                  <PeopleIcon  size={34} color={colors.secondary} />
                  <Text
                    style={styles.teachExplanation} allowFontScaling maxFontSizeMultiplier={2}
                    accessibilityLanguage={otherLanguage.speechTag}
                    accessibilityLiveRegion="assertive"
                  >
                    {other.askInterpreter}
                  </Text>
                  <Text style={styles.teachSub} allowFontScaling maxFontSizeMultiplier={2}>{en.askInterpreter}</Text>
                  <PressableScale
                    onPress={showRightsFromTeach}
                    accessibilityRole="button"
                    accessibilityLabel={`${other.rightsShow} — ${en.rightsShow}`}
                    style={styles.rightsButton}
                  >
                    <ShieldIcon  size={22} color={colors.onPrimary} />
                    <View style={styles.rightsButtonLabels}>
                      <Text style={styles.rightsButtonText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                        {other.rightsShow}
                      </Text>
                      <Text style={styles.rightsButtonTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.rightsShow}</Text>
                    </View>
                  </PressableScale>
                </View>
              ) : null}

              {teach.stage === 'error' ? (
                <View style={styles.teachCenter} accessibilityLiveRegion="assertive">
                  <AlertCircleIcon  size={34} color={colors.dangerText} />
                  <Text style={styles.teachExplanation} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.connectionError}
                  </Text>
                  <Text style={styles.teachSub} allowFontScaling maxFontSizeMultiplier={2}>{en.connectionError}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}

      {/* F5: medication label scan result. */}
      {scan ? (
        <Modal visible transparent animationType="slide" onRequestClose={closeScan}>
          <View style={styles.sheetBackdrop}>
            <Pressable
              style={styles.sheetDismiss}
              onPress={closeScan}
              accessibilityRole="button"
              accessibilityLabel={`${other.close} — ${en.close}`}
            />
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} importantForAccessibility="no" />
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <MedkitIcon  size={24} color={colors.primary} />
                  <View style={styles.sheetTitleWrap}>
                    <Text style={styles.sheetTitle} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityRole="header" accessibilityLanguage={otherLanguage.speechTag}>
                      {other.scanTitle}
                    </Text>
                    <Text style={styles.sheetTitleEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.scanTitle}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={closeScan}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.close} — ${en.close}`}
                  style={({ pressed }) => [styles.sheetClose, pressed && styles.pressedDim]}
                >
                  <CloseIcon  size={22} color={colors.primary} />
                  <Text style={styles.sheetCloseText} allowFontScaling maxFontSizeMultiplier={1.3}>
                    {other.close} · {en.close}
                  </Text>
                </Pressable>
              </View>

              {scan.status === 'loading' ? (
                <View style={styles.scanCenter} accessibilityLiveRegion="polite">
                  <TurnSkeleton />
                  <Text style={styles.scanStatus} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                    {other.scanReading}
                  </Text>
                  <Text style={styles.scanStatusEn} allowFontScaling maxFontSizeMultiplier={2}>{en.scanReading}</Text>
                </View>
              ) : null}

              {scan.status === 'unreadable' || scan.status === 'permission' || scan.status === 'error' ? (
                <View style={styles.scanCenter} accessibilityLiveRegion="assertive">
                  <BrandGlyph
                    name={scan.status === 'permission' ? 'camera-outline' : 'alert-circle'}
                    size={34}
                    color={colors.dangerText}
                  />
                  <Text style={styles.scanError} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                    {scan.status === 'unreadable'
                      ? other.scanUnreadable
                      : scan.status === 'permission'
                        ? other.cameraPermission
                        : other.connectionError}
                  </Text>
                  <Text style={styles.scanStatusEn} allowFontScaling maxFontSizeMultiplier={2}>
                    {scan.status === 'unreadable'
                      ? en.scanUnreadable
                      : scan.status === 'permission'
                        ? en.cameraPermission
                        : en.connectionError}
                  </Text>
                  {scan.status !== 'permission' ? (
                    <PressableScale
                      onPress={() => {
                        setScan(null);
                        void openScanner();
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${other.tryAgain} — ${en.tryAgain}`}
                      style={styles.scanRetry}
                    >
                      <RefreshIcon  size={20} color={colors.dangerText} />
                      <Text style={styles.scanRetryText} allowFontScaling maxFontSizeMultiplier={2}>
                        {other.tryAgain} · {en.tryAgain}
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>
              ) : null}

              {scan.status === 'ready' ? (
                <ScrollView contentContainerStyle={styles.scanContent}>
                  <Text style={styles.scanName} allowFontScaling maxFontSizeMultiplier={2}>{scan.result.name}</Text>
                  {(
                    [
                      { label: other.scanDose, labelEn: en.scanDose, pair: scan.result.howMuch, icon: 'water-outline' },
                      { label: other.scanWhen, labelEn: en.scanWhen, pair: scan.result.when, icon: 'time-outline' },
                      { label: other.scanWarnings, labelEn: en.scanWarnings, pair: scan.result.warnings, icon: 'warning-outline' },
                    ] as const
                  )
                    .filter((section) => section.pair.other || section.pair.en)
                    .map((section) => (
                      <View key={section.labelEn} style={styles.scanSection}>
                        <View style={styles.scanSectionHead}>
                          <BrandGlyph name={section.icon} size={18} color={colors.primary} importantForAccessibility="no" />
                          <Text style={styles.scanSectionLabel} allowFontScaling maxFontSizeMultiplier={2}>
                            {section.label === section.labelEn ? section.labelEn : `${section.label} · ${section.labelEn}`}
                          </Text>
                        </View>
                        <Text style={styles.scanPrimary} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                          {section.pair.other}
                        </Text>
                        <Text style={styles.scanSecondary} allowFontScaling maxFontSizeMultiplier={2}>{section.pair.en}</Text>
                      </View>
                    ))}

                  <PressableScale
                    onPress={speakScan}
                    disabled={phase !== 'idle'}
                    accessibilityRole="button"
                    accessibilityLabel={`${other.speakAloud} — ${en.speakAloud}`}
                    style={[styles.scanSpeak, phase !== 'idle' && styles.dimmed]}
                  >
                    <SpeakIcon  size={24} color={colors.onPrimary} />
                    <View style={styles.sayLabelsInline}>
                      <Text style={styles.scanSpeakText} allowFontScaling maxFontSizeMultiplier={1.3} accessibilityLanguage={otherLanguage.speechTag}>
                        {other.speakAloud}
                      </Text>
                      {other.speakAloud !== en.speakAloud ? (
                        <Text style={styles.scanSpeakTextEn} allowFontScaling maxFontSizeMultiplier={1.3}>{en.speakAloud}</Text>
                      ) : null}
                    </View>
                  </PressableScale>

                  <View style={styles.scanPharmacist}>
                    <InfoIcon  size={18} color={colors.textMuted} />
                    <View style={styles.scanPharmacistText}>
                      <Text style={styles.scanSecondary} allowFontScaling maxFontSizeMultiplier={2} accessibilityLanguage={otherLanguage.speechTag}>
                        {other.pharmacistLine}
                      </Text>
                      <Text style={styles.scanSecondary} allowFontScaling maxFontSizeMultiplier={2}>{en.pharmacistLine}</Text>
                    </View>
                  </View>
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}

      {/* F4: where does it hurt — tap the body, pick 0–10, it speaks English. */}
      <BodyMapModal
        visible={bodyMapOpen}
        otherLanguage={otherLanguage}
        onClose={() => setBodyMapOpen(false)}
        onConfirm={confirmBodyPain}
      />

      {/* Interpreter rights — static, offline, made to be handed to staff. */}
      <RightsCard visible={rightsOpen} otherLanguage={otherLanguage} onClose={() => setRightsOpen(false)} />

      {/* F3: ephemeral visit summary — closing it wipes the text from memory. */}
      <SummaryModal state={summary} otherLanguage={otherLanguage} onClose={() => setSummary(null)} />

      {/* F1: a translation blown up to fill the screen. */}
      <FullscreenTranslation
        text={fullscreenTurn?.translation ?? null}
        language={fullscreenTurn?.listener ?? null}
        otherLanguage={otherLanguage}
        onClose={() => setFullscreenTurn(null)}
      />
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
    minHeight: 60,
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
  headerChipTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
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
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
  },
  hint: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  hintScene: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  hintTagline: {
    fontSize: type.title,
    color: colors.text,
    textAlign: 'center',
    lineHeight: type.title * 1.25,
    paddingHorizontal: spacing.md,
  },
  hintTaglineEn: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  hintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.text,
    textAlign: 'center',
  },
  hintTextSmall: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  hintArrow: {
    marginTop: spacing.md,
  },
  recordPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    ...shadows.floating,
  },
  recordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  recordTimer: {
    fontFamily: fonts.display,
    fontSize: type.hero,
    color: colors.listening,
    fontVariant: ['tabular-nums'],
  },
  recordLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.textMuted,
    flexShrink: 1,
    textAlign: 'center',
  },
  nudgeSlot: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.hairline,
  },
  meterDebug: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textFaint,
    textAlign: 'center',
  },
  nudgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.small,
    color: colors.listening,
    textAlign: 'center',
  },
  nudgeTextEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.listening,
    textAlign: 'center',
    opacity: 0.85,
  },
  doneOuter: {
    borderRadius: radius.xl,
    ...shadows.raised,
  },
  doneInner: {
    minHeight: 120,
    borderRadius: radius.xl,
    backgroundColor: colors.listening,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  doneInnerPressed: {
    backgroundColor: colors.listeningPressed,
  },
  doneLabels: {
    alignItems: 'center',
  },
  doneText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.title,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  doneTextEn: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.onPrimary,
    opacity: 0.9,
    textAlign: 'center',
  },
  cancelLink: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.textMuted,
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
    ...shadows.raised,
  },
  // The accent bar sits on the card's "tail" side, so emphasis and alignment
  // read as one gesture.
  turnLatestLeft: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  turnLatestRight: {
    borderRightWidth: 4,
    borderRightColor: colors.accent,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  monogramChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramChipSecondary: {
    backgroundColor: colors.surfaceTintSecondary,
  },
  monogramText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.micro,
    color: colors.primary,
  },
  monogramTextSecondary: {
    color: colors.secondary,
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
  translationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  translationLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    flexShrink: 1,
  },
  flippedBlock: {
    transform: [{ rotate: '180deg' }],
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    padding: spacing.sm,
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
  turnActionsWrap: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  turnActions: {
    flexDirection: 'row',
    gap: spacing.xs,
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
  turnButtonLabels: {
    flexShrink: 1,
    alignItems: 'center',
  },
  turnButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
  turnButtonTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.primary,
    opacity: 0.85,
    flexShrink: 1,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '94%',
    alignSelf: 'center',
    ...shadows.card,
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
    minHeight: MIN_TARGET,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  toolButtonOn: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceTint,
  },
  toolButtonLabels: {
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  toolButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  toolButtonTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textMuted,
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
    gap: spacing.hairline,
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  offlineBody: {
    flex: 1,
    gap: spacing.hairline,
  },
  offlineText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.text,
    lineHeight: type.caption * 1.4,
  },
  offlineTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textMuted,
    lineHeight: type.micro * 1.4,
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
  sheetTitleWrap: {
    flexShrink: 1,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: type.button,
    color: colors.text,
    flexShrink: 1,
  },
  sheetTitleEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceTintSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  disclaimerBody: {
    flex: 1,
    gap: spacing.hairline,
  },
  disclaimerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.text,
    lineHeight: type.caption * 1.4,
  },
  disclaimerTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.textMuted,
    lineHeight: type.micro * 1.4,
  },
  disclaimerOk: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  disclaimerOkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.secondary,
  },
  scanCenter: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  scanStatus: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.primary,
  },
  scanStatusEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: type.caption * 1.4,
  },
  scanError: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.dangerText,
    textAlign: 'center',
    lineHeight: type.body * 1.4,
  },
  scanRetry: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.dangerText,
    paddingHorizontal: spacing.md,
  },
  scanRetryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.dangerText,
  },
  scanContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  scanName: {
    fontFamily: fonts.bodyBold,
    fontSize: type.title,
    color: colors.text,
    lineHeight: type.title * 1.25,
  },
  scanSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xxs,
    ...shadows.card,
  },
  scanSectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  scanSectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scanPrimary: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.text,
    lineHeight: type.body * 1.4,
  },
  scanSecondary: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    lineHeight: type.small * 1.4,
  },
  scanSpeak: {
    minHeight: MIN_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  sayLabelsInline: {
    alignItems: 'center',
  },
  scanSpeakText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.onPrimary,
  },
  scanSpeakTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.onPrimary,
    opacity: 0.9,
  },
  scanPharmacist: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  scanPharmacistText: {
    flex: 1,
    gap: spacing.hairline,
  },
  bodyMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: MIN_TARGET + 8,
    ...shadows.raised,
  },
  bodyMapIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.onPrimaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyMapTextWrap: {
    flex: 1,
    gap: spacing.hairline,
  },
  bodyMapTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: type.body,
    color: colors.onPrimary,
  },
  bodyMapSub: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.onPrimary,
    opacity: 0.9,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  summaryPill: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.primary,
  },
  centerBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  teachCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.sm,
    ...shadows.floating,
  },
  teachClose: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  teachCenter: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  teachExplanation: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.body,
    color: colors.text,
    lineHeight: type.body * 1.45,
  },
  teachQuestion: {
    fontFamily: fonts.bodyBold,
    fontSize: type.button,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  teachSub: {
    fontFamily: fonts.body,
    fontSize: type.small,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: type.small * 1.4,
  },
  teachReplay: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: spacing.sm,
    alignSelf: 'center',
  },
  teachReplayText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.caption,
    color: colors.primary,
  },
  rightsButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    alignSelf: 'stretch',
  },
  rightsButtonLabels: {
    alignItems: 'center',
  },
  rightsButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.onPrimary,
  },
  rightsButtonTextEn: {
    fontFamily: fonts.body,
    fontSize: type.micro,
    color: colors.onPrimary,
    opacity: 0.9,
  },
  teachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceTintSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  teachBannerText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.secondary,
    lineHeight: type.small * 1.35,
  },
  teachChoices: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  teachChoice: {
    minHeight: 92,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.hairline,
    paddingVertical: spacing.sm,
  },
  teachYes: {
    backgroundColor: colors.primary,
  },
  teachNo: {
    backgroundColor: colors.listening,
  },
  teachChoiceText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.button,
    color: colors.onPrimary,
  },
  teachChoiceTextEn: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.onPrimary,
    opacity: 0.9,
  },
  typeContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  typeInput: {
    minHeight: 104,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontFamily: fonts.body,
    fontSize: type.body,
    color: colors.text,
    textAlignVertical: 'top',
  },
  nameToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  nameToggleOn: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceTint,
  },
  nameToggleLabels: {
    flex: 1,
  },
  nameToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.textMuted,
  },
  nameToggleTextOn: {
    color: colors.primary,
  },
  nameToggleHint: {
    fontFamily: fonts.body,
    fontSize: type.caption,
    color: colors.textFaint,
  },
  nameCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCheckOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeSendRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeSend: {
    minHeight: MIN_TARGET,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  typeSendText: {
    fontFamily: fonts.bodyMedium,
    fontSize: type.small,
    color: colors.onPrimary,
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
  phraseIconCircleUrgent: {
    backgroundColor: colors.dangerBg,
  },
  sheetSectionUrgent: {
    color: colors.dangerText,
  },
  painRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
    paddingRight: spacing.md,
  },
  painChip: {
    minWidth: 56,
    minHeight: 56,
    paddingHorizontal: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  painChipHigh: {
    borderColor: colors.listening,
    borderWidth: 2,
  },
  painChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: type.button,
    color: colors.text,
  },
  painChipTextHigh: {
    color: colors.dangerText,
  },
  phraseTextWrap: {
    flex: 1,
    gap: spacing.hairline,
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
