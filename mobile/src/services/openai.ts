import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';

import type { Language } from '../config/languages';
import { getDeviceId } from './storage';

/**
 * All OpenAI calls live here: Whisper (speech-to-text), GPT-4o (translation),
 * and TTS (speech synthesis).
 *
 * Backend selection: EXPO_PUBLIC_API_PROXY_URL (production — key lives on the
 * proxy, see proxy/README.md) or EXPO_PUBLIC_OPENAI_API_KEY (local dev,
 * key inlined into the dev bundle only).
 *
 * Privacy: nothing is persisted. Transcripts and translations only ever live
 * in component state, and the one temporary TTS audio file in the OS cache is
 * overwritten every turn and deleted as soon as the next recording starts.
 */
const PROXY_URL = process.env.EXPO_PUBLIC_API_PROXY_URL?.replace(/\/$/, '');
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const BASE_URL = PROXY_URL ? `${PROXY_URL}/v1` : 'https://api.openai.com/v1';

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

/** Auth for the active backend: device id for the proxy, bearer key direct. */
function apiHeaders(): Record<string, string> {
  if (PROXY_URL) return { 'x-medlingua-device': getDeviceId() };
  if (!API_KEY) throw new MissingKeyError();
  return { Authorization: `Bearer ${API_KEY}` };
}

type FetchInit = NonNullable<Parameters<typeof expoFetch>[1]>;
type ApiResponse = Awaited<ReturnType<typeof expoFetch>>;

/**
 * fetch with a hard timeout; timeouts surface as retryable TranslationErrors.
 * Uses expo/fetch explicitly: on SDK 54 the global fetch is still React
 * Native's, which can't upload expo-file-system Files as Blobs (the Whisper
 * request) and is unreliable for arrayBuffer() (the TTS bytes). The browser
 * preview masked both — expo/fetch behaves the same everywhere.
 */
async function fetchWithTimeout(url: string, init: FetchInit): Promise<ApiResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await expoFetch(url, { ...init, signal: controller.signal });
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
    // A domain prompt in the target language biases Whisper toward clinical
    // vocabulary and correct spelling. Only sent when the language is known:
    // in auto mode a language-specific prompt would skew language detection.
    form.append('prompt', language.whisperPrompt);
  }

  let res: ApiResponse;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: apiHeaders(),
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

  let res: ApiResponse;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        ...apiHeaders(),
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
export async function simplify(
  text: string,
  into: Language,
  evenSimpler: boolean,
  /** A previous explanation that came back unchanged — tells the model its retry was a no-op. */
  rejectedAttempt?: string,
): Promise<string> {
  const system = [
    `You are a medical interpreter using the teach-back method. Re-explain the clinician's message below in ${into.englishName} at the simplest possible level.`,
    'Rules:',
    '- Short sentences. Everyday words. Zero medical jargon.',
    '- Keep every critical fact exactly: medication names, doses, times, warnings.',
    '- Do not add information that is not in the message.',
    evenSimpler
      ? '- The patient did NOT understand the previous explanation. Go even simpler: one idea per sentence, as you would explain to a child, and keep it short.'
      : '',
    rejectedAttempt
      ? `- Your previous answer was identical to the explanation the patient already failed to understand: "${rejectedAttempt}". Say it a DIFFERENT, shorter, simpler way.`
      : '',
    '- Return only the explanation, no commentary.',
  ]
    .filter(Boolean)
    .join('\n');

  let res: ApiResponse;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        ...apiHeaders(),
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

/** Strips accents and lowercases, so "Ibuprofeno" matches "ibuprofeno". */
function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Fact-checks a generated summary against the transcript it claims to
 * summarize. Returns tokens in the summary that the transcript cannot back up:
 * dose-like tokens ("200 mg") and words with common medication-name suffixes
 * ("ibuprofeno"). A heuristic, not a proof — the prompt is the primary
 * defense; this is the hard gate for the most dangerous fabrication class
 * (invented drugs and doses on a take-home medical document).
 */
export function findUngroundedTokens(summary: string, transcript: string): string[] {
  const t = normalizeForMatch(transcript);
  const s = normalizeForMatch(summary);
  const violations = new Set<string>();

  // Any dose (number + unit) in the summary must have its number in the source.
  for (const m of s.matchAll(/\d+(?:[.,]\d+)?\s?(?:mg|mcg|ug|ml|g|iu|ui)\b/g)) {
    const num = m[0].match(/\d+(?:[.,]\d+)?/)?.[0];
    if (num && !t.includes(num)) violations.add(m[0]);
  }

  // Medication-name heuristic: common pharma suffixes across our languages.
  const drugSuffix =
    /(?:cilina|cillin|micina|mycin|profeno|profen|statina|statin|prazol|prazole|pril|sartan|dipina|dipine|zepam|zolam|formina|formin|oxacina|oxacin|tamol|tinib|semida|semide)$/;
  for (const m of s.matchAll(/\p{L}{6,}/gu)) {
    if (drugSuffix.test(m[0]) && !t.includes(m[0])) violations.add(m[0]);
  }

  return [...violations];
}

/**
 * Builds a short bilingual visit summary (patient language first, English
 * second) from the in-memory transcript. The result is only ever held in
 * component state and shown behind a countdown — never written to disk.
 *
 * Grounding contract: every bullet must restate a transcript line. The model
 * is instructed quote-only, and the output is fact-checked with
 * `findUngroundedTokens`; one retry with the violations fed back, then fail —
 * an error state is safer than a take-home document naming a medication
 * nobody prescribed.
 */
export async function summarizeVisit(lines: SummaryLine[], patient: Language): Promise<string> {
  const system = [
    `You are a medical interpreter creating a take-home summary of a clinic conversation. Write the ENTIRE summary twice: first in ${patient.englishName}, then in English.`,
    'THE ONE UNBREAKABLE RULE: every bullet must restate something explicitly present in the transcript. You may translate and simplify wording, but you may not add ANY fact, symptom, medication, dose, or time that the transcript does not contain. Inventing content in a medical document is a safety failure.',
    'Rules:',
    '- Before writing a bullet, identify the exact transcript line it restates. If you cannot point to a line, do not write the bullet.',
    '- Use these four section headings, translated appropriately: Symptoms, Medications, Instructions, Follow-up.',
    `- The output always has exactly eight sections: the four headings in ${patient.englishName}, then the same four headings again in English. Never stop after the first half.`,
    '- Under each heading, short plain lines starting with "• ". If the transcript has no content for a section, output exactly "• —". An empty section is correct and expected — most short conversations fill only one or two sections.',
    '- Simple words a 6th grader would understand. Copy medication names, doses, and times exactly as the transcript writes them.',
    '- Plain text only: no markdown besides the "• " bullets, no extra commentary.',
  ].join('\n');

  const transcript = lines.map((l) => `${l.speaker.englishName}: ${l.text}`).join('\n');

  const generate = async (feedback: string | null): Promise<string> => {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: system },
      { role: 'user', content: transcript },
    ];
    if (feedback) messages.push({ role: 'user', content: feedback });

    let res: ApiResponse;
    try {
      res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          ...apiHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4o', temperature: 0, messages }),
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
  };

  // Both fabricated facts AND a missing English half are validation failures —
  // the clinician must be able to read the take-home document too.
  const problemsWith = (text: string): string | null => {
    const ungrounded = findUngroundedTokens(text, transcript);
    if (ungrounded.length > 0) {
      return `Your summary included "${ungrounded.join('", "')}" — none of which appear in the transcript. That is a safety failure. Regenerate using ONLY facts from the transcript; leave sections as "• —" when the transcript says nothing about them.`;
    }
    const englishHalf = ['Symptoms', 'Medications', 'Instructions', 'Follow-up'].every((h) =>
      new RegExp(h, 'i').test(text),
    );
    if (!englishHalf) {
      return 'Your summary is missing the English half. Regenerate with all eight sections: the four headings in the patient language first, then the same four sections again in English.';
    }
    return null;
  };

  let summary = await generate(null);
  let problem = problemsWith(summary);
  if (problem) {
    summary = await generate(problem);
    problem = problemsWith(summary);
    if (problem) {
      throw new TranslationError(`Summary failed validation: ${problem}`);
    }
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

  let res: ApiResponse;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        ...apiHeaders(),
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
  if (!PROXY_URL && !API_KEY) return null;

  try {
    const res = await fetchWithTimeout(`${BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        ...apiHeaders(),
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
