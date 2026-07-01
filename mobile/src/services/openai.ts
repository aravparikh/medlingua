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

function requireKey(): string {
  if (!API_KEY) {
    throw new Error(
      'Missing OpenAI API key. Copy .env.example to .env, set EXPO_PUBLIC_OPENAI_API_KEY, and restart the dev server.',
    );
  }
  return API_KEY;
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
  if (language) {
    form.append('language', language.whisper);
  } else {
    // verbose_json includes the detected language name.
    form.append('response_format', 'verbose_json');
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
  } catch {
    throw new TranslationError('Network error during transcription');
  }
  if (!res.ok) {
    throw new TranslationError(`Transcription failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { text?: string; language?: string };
  const trimmed = (data.text ?? '').trim();
  if (!trimmed) {
    throw new TranslationError('Nothing was heard', true);
  }
  const detectedCode = language
    ? language.code
    : (data.language && WHISPER_NAME_TO_CODE[data.language.toLowerCase()]) || null;
  return { text: trimmed, detectedCode };
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
    res = await fetch(`${BASE_URL}/chat/completions`, {
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
  } catch {
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
    const res = await fetch(`${BASE_URL}/audio/speech`, {
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
