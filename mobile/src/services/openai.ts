import { File, Paths } from 'expo-file-system';

import type { Language } from '../config/languages';

/**
 * All OpenAI calls live here: Whisper (speech-to-text), GPT-4o (translation),
 * and TTS (speech synthesis).
 *
 * The key is read from EXPO_PUBLIC_OPENAI_API_KEY (see .env.example). For an
 * App Store release, proxy these calls through your own server instead of
 * shipping a key in the binary — swap BASE_URL and drop the Authorization
 * header to do that; the call sites don't change.
 *
 * Privacy: nothing is persisted. Transcripts and translations only ever live
 * in component state, and the one temporary TTS audio file in the OS cache is
 * overwritten every turn and deleted as soon as the next recording starts.
 */
const BASE_URL = 'https://api.openai.com/v1';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/** A hung request must never brick the conversation — abort and show a retry. */
const REQUEST_TIMEOUT_MS = 20_000;

/** Thrown for anything the user can fix by retrying (network, API hiccup). */
export class TranslationError extends Error {
  constructor(
    message: string,
    /** True when the audio was fine but empty/unintelligible — show "I didn't catch that". */
    public readonly nothingHeard = false,
  ) {
    super(message);
  }
}

/** Thrown when the app has no API key configured — a setup problem, not a user one. */
export class MissingKeyError extends Error {
  constructor() {
    super('Missing OpenAI API key. Copy .env.example to .env, set EXPO_PUBLIC_OPENAI_API_KEY, and restart the dev server.');
  }
}

function requireKey(): string {
  if (!API_KEY) throw new MissingKeyError();
  return API_KEY;
}

/** fetch with a hard timeout; timeouts surface as retryable TranslationErrors. */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new TranslationError('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Maps Whisper's detected-language names (verbose_json) to our language codes. */
const WHISPER_NAME_TO_CODE: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  chinese: 'zh',
  mandarin: 'zh',
  vietnamese: 'vi',
  russian: 'ru',
};

export interface TranscriptionResult {
  text: string;
  /** Our language code for what Whisper heard; null when it couldn't be mapped. */
  detectedCode: string | null;
  /** True when Whisper itself wasn't confident — better to ask the person to
   * repeat than to confidently speak a possibly-wrong translation. */
  lowConfidence: boolean;
}

/**
 * Phrases Whisper is known to hallucinate on silence or breath noise, plus
 * subtitle-credit spam it learned from video captions. Only treated as
 * hallucinations when the audio also looks speech-free (see below), so a
 * patient genuinely saying "thank you" still goes through.
 */
const PHANTOM_PHRASES = new Set([
  'thank you',
  'thanks for watching',
  'thank you for watching',
  'thank you so much for watching',
  'please subscribe',
  'gracias',
  'gracias por ver',
  'gracias por ver el video',
  'ご視聴ありがとうございました',
  '谢谢观看',
  'спасибо за просмотр',
  'hẹn gặp lại các bạn trong những video tiếp theo',
]);

function normalizePhantom(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?。，！？…\s]+/gu, ' ')
    .trim();
}

interface WhisperSegment {
  no_speech_prob?: number;
  avg_logprob?: number;
}

/** True when the transcript is almost certainly a silence hallucination. */
function isHallucination(text: string, segments: WhisperSegment[] | undefined): boolean {
  if (/amara\.org/i.test(text)) return true;
  const probs = (segments ?? []).map((s) => s.no_speech_prob ?? 0);
  const avgNoSpeech = probs.length > 0 ? probs.reduce((a, b) => a + b, 0) / probs.length : 0;
  if (probs.length > 0 && probs.every((p) => p > 0.8)) return true;
  return avgNoSpeech > 0.5 && PHANTOM_PHRASES.has(normalizePhantom(text));
}

/**
 * Transcribes a recorded audio file with Whisper.
 * Pass the speaker's language when it is known (two-button mode) for a more
 * accurate transcript; pass null to let Whisper detect it (auto mode).
 */
export async function transcribe(audioUri: string, language: Language | null): Promise<TranscriptionResult> {
  const key = requireKey();

  const audioFile = new File(audioUri);
  const form = new FormData();
  // expo-file-system's File implements Blob, so it can be uploaded directly.
  form.append('file', audioFile as unknown as Blob, `speech${audioFile.extension || '.m4a'}`);
  form.append('model', 'whisper-1');
  form.append('temperature', '0');
  // verbose_json gives the detected language plus per-segment no-speech
  // probabilities, used to reject silence hallucinations.
  form.append('response_format', 'verbose_json');
  if (language) {
    form.append('language', language.whisper);
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
  } catch (err) {
    if (err instanceof TranslationError) throw err;
    throw new TranslationError('Network error during transcription');
  }
  if (!res.ok) {
    throw new TranslationError(`Transcription failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { text?: string; language?: string; segments?: WhisperSegment[] };
  const trimmed = (data.text ?? '').trim();
  if (!trimmed || isHallucination(trimmed, data.segments)) {
    throw new TranslationError('Nothing was heard', true);
  }
  const detectedCode = language
    ? language.code
    : (data.language && WHISPER_NAME_TO_CODE[data.language.toLowerCase()]) || null;

  // Confidence gate: avg_logprob near 0 is clear speech; below ~-1.2 Whisper
  // was largely guessing. Threshold is deliberately lenient — accented speech
  // in a quiet room typically sits around -0.3 to -0.7.
  const logprobs = (data.segments ?? [])
    .map((seg) => seg.avg_logprob)
    .filter((v): v is number => typeof v === 'number');
  const meanLogprob = logprobs.length > 0 ? logprobs.reduce((a, b) => a + b, 0) / logprobs.length : 0;
  const lowConfidence = meanLogprob < -1.2;

  return { text: trimmed, detectedCode, lowConfidence };
}

/** Translates a transcript between the two active languages with GPT-4o. */
export async function translate(text: string, from: Language, to: Language): Promise<string> {
  const key = requireKey();

  const system = [
    `You are a professional medical interpreter. Translate the user's message from ${from.englishName} into ${to.englishName}.`,
    'Rules:',
    '- Translate for meaning and clarity in a medical setting, not word-for-word.',
    '- Use plain, simple language a patient would understand.',
    '- Preserve important medical terms accurately: medications, symptoms, body parts, dosages, and yes/no answers.',
    '- Respect the natural grammar and politeness norms of the target language.',
    '- If the input is ambiguous, translate the most likely meaning faithfully — do not invent details.',
    '- Return only the translation, with no commentary, notes, or quotation marks.',
  ].join('\n');

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof TranslationError) throw err;
    throw new TranslationError('Network error during translation');
  }
  if (!res.ok) {
    throw new TranslationError(`Translation failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const translation = data.choices?.[0]?.message?.content?.trim();
  if (!translation) {
    throw new TranslationError('Empty translation');
  }
  return translation;
}

/**
 * Teach-back: re-explains a clinician's message in the patient's language at
 * the simplest possible level. `evenSimpler` is the second attempt, used when
 * the patient answered "no" to "did you understand?".
 */
export async function simplify(text: string, into: Language, evenSimpler: boolean): Promise<string> {
  const key = requireKey();

  const system = [
    `You are a medical interpreter using the teach-back method. Re-explain the clinician's message below in ${into.englishName} at the simplest possible level.`,
    'Rules:',
    '- Short sentences. Everyday words. Zero medical jargon.',
    '- Keep every critical fact exactly: medication names, doses, times, warnings.',
    '- Do not add information that is not in the message.',
    evenSimpler
      ? '- The patient did NOT understand the previous explanation. Go even simpler: one idea per sentence, as you would explain to a child, and keep it short.'
      : '',
    '- Return only the explanation, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof TranslationError) throw err;
    throw new TranslationError('Network error during teach-back');
  }
  if (!res.ok) {
    throw new TranslationError(`Teach-back failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const explanation = data.choices?.[0]?.message?.content?.trim();
  if (!explanation) {
    throw new TranslationError('Empty teach-back explanation');
  }
  return explanation;
}

/** One line of transcript for the visit summary — original text plus who said it. */
export interface SummaryLine {
  speaker: Language;
  text: string;
}

/**
 * Builds a short bilingual visit summary (patient language first, English
 * second) from the in-memory transcript. The result is only ever held in
 * component state and shown behind a countdown — never written to disk.
 */
export async function summarizeVisit(lines: SummaryLine[], patient: Language): Promise<string> {
  const key = requireKey();

  const system = [
    `You are a medical interpreter writing a short summary of a clinic conversation for the patient to keep. Write the ENTIRE summary twice: first in ${patient.englishName}, then in English.`,
    'Rules:',
    '- Use these four section headings, translated appropriately: Symptoms, Medications, Instructions, Follow-up.',
    '- Under each heading, short plain lines starting with "• ". If nothing was discussed for a section, write "• —".',
    '- Simple words a 6th grader would understand. Preserve medication names, doses, and times exactly.',
    '- Only include what was actually said — never invent or infer details.',
    '- Plain text only: no markdown besides the "• " bullets, no extra commentary.',
  ].join('\n');

  const transcript = lines.map((l) => `${l.speaker.englishName}: ${l.text}`).join('\n');

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: transcript },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof TranslationError) throw err;
    throw new TranslationError('Network error during summary');
  }
  if (!res.ok) {
    throw new TranslationError(`Summary failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const summary = data.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw new TranslationError('Empty summary');
  }
  return summary;
}

/** What the medication-label scan extracted, explained in both languages. */
export interface MedLabelResult {
  readable: boolean;
  /** Medication name and strength as printed on the label. */
  name: string;
  howMuch: { en: string; other: string };
  when: { en: string; other: string };
  warnings: { en: string; other: string };
}

/**
 * Reads a photo of a medication label with GPT-4o vision and explains it at a
 * 6th-grade level in English and the patient's language. The photo is sent
 * once and never persisted. An unreadable/irrelevant photo comes back as
 * `readable: false` so the UI can show a friendly retry, never a raw error.
 */
export async function readMedicationLabel(base64Jpeg: string, patient: Language): Promise<MedLabelResult> {
  const key = requireKey();

  const system = [
    'You read photos of medication labels for patients with low health literacy.',
    'Respond ONLY with a JSON object of this exact shape:',
    '{"readable": boolean, "name": string, "howMuch": {"en": string, "other": string}, "when": {"en": string, "other": string}, "warnings": {"en": string, "other": string}}',
    `"other" values are written in ${patient.englishName}; "en" values in English. Both at a 6th-grade reading level, short plain sentences.`,
    '"name" is the medication name and strength exactly as printed (e.g. "Lisinopril 10 mg").',
    '"howMuch" = the dose in plain words. "when" = timing/frequency in plain words. "warnings" = key printed warnings, or "" if none are visible.',
    'If the photo is not a medication label, or is too blurry/dark to read confidently, return {"readable": false} with all other fields as empty strings.',
    'NEVER guess a medication name — misreading a label can hurt someone. When unsure, return readable: false.',
  ].join('\n');

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Read this medication label.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` } },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof TranslationError) throw err;
    throw new TranslationError('Network error during label scan');
  }
  if (!res.ok) {
    throw new TranslationError(`Label scan failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new TranslationError('Empty label scan response');
  }
  try {
    const parsed = JSON.parse(raw) as Partial<MedLabelResult>;
    const pair = (v: unknown): { en: string; other: string } => {
      const o = (v ?? {}) as { en?: unknown; other?: unknown };
      return { en: typeof o.en === 'string' ? o.en : '', other: typeof o.other === 'string' ? o.other : '' };
    };
    return {
      readable: parsed.readable === true && typeof parsed.name === 'string' && parsed.name.trim().length > 0,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      howMuch: pair(parsed.howMuch),
      when: pair(parsed.when),
      warnings: pair(parsed.warnings),
    };
  } catch {
    throw new TranslationError('Malformed label scan response');
  }
}

/** The single, reused TTS output file — overwritten each turn, never accumulated. */
function ttsFile(): File {
  return new File(Paths.cache, 'medlingua-tts.mp3');
}

/**
 * Synthesizes speech for the translation and returns a local file URI to play.
 * Returns null on failure so the caller can fall back to on-device speech.
 */
export async function synthesize(text: string, language: Language): Promise<string | null> {
  if (!API_KEY) return null;

  try {
    const res = await fetchWithTimeout(`${BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: language.ttsVoice,
        input: text,
        instructions: `Speak in ${language.englishName}, clearly and at a calm, slightly slow pace, as if speaking with an elderly patient.`,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) return null;

    const bytes = new Uint8Array(await res.arrayBuffer());
    const file = ttsFile();
    if (file.exists) file.delete();
    file.write(bytes);
    return file.uri;
  } catch {
    return null;
  }
}

/** Removes the temporary TTS audio from the cache. */
export function clearSpokenAudio(): void {
  try {
    const file = ttsFile();
    if (file.exists) file.delete();
  } catch {
    // Cache cleanup is best-effort.
  }
}
