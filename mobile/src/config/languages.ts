/**
 * Single source of truth for every supported language.
 * Adding a language later = adding one entry here (plus its UI strings in src/i18n/strings.ts).
 *
 * English is always one side of the conversation; the user picks the other side.
 */
export interface Language {
  /** ISO 639-1 code — also the key into the UI strings table. */
  code: string;
  /** The language written in its own script. This is what non-English speakers see. */
  nativeName: string;
  /** English name, only ever shown as small secondary text. */
  englishName: string;
  flag: string;
  /** Language hint passed to Whisper for better transcription. */
  whisper: string;
  /** BCP-47 tag used for expo-speech fallback TTS and iOS accessibilityLanguage. */
  speechTag: string;
  /** OpenAI TTS voice used when speaking this language aloud. */
  ttsVoice: string;
  /** Label on this language's big speak button, in its own script. */
  speakLabel: string;
}

export const ENGLISH: Language = {
  code: 'en',
  nativeName: 'English',
  englishName: 'English',
  flag: '🇺🇸',
  whisper: 'en',
  speechTag: 'en-US',
  ttsVoice: 'alloy',
  speakLabel: 'Speak English',
};

export const LANGUAGES: Language[] = [
  {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸',
    whisper: 'es',
    speechTag: 'es-MX',
    ttsVoice: 'nova',
    speakLabel: 'Hablar español',
  },
  {
    code: 'zh',
    nativeName: '中文',
    englishName: 'Chinese (Mandarin)',
    flag: '🇨🇳',
    whisper: 'zh',
    speechTag: 'zh-CN',
    ttsVoice: 'nova',
    speakLabel: '说中文',
  },
  {
    code: 'vi',
    nativeName: 'Tiếng Việt',
    englishName: 'Vietnamese',
    flag: '🇻🇳',
    whisper: 'vi',
    speechTag: 'vi-VN',
    ttsVoice: 'nova',
    speakLabel: 'Nói tiếng Việt',
  },
  {
    code: 'ru',
    nativeName: 'Русский',
    englishName: 'Russian',
    flag: '🇷🇺',
    whisper: 'ru',
    speechTag: 'ru-RU',
    ttsVoice: 'nova',
    speakLabel: 'Говорить по-русски',
  },
];

export function getLanguage(code: string): Language {
  if (code === 'en') return ENGLISH;
  const found = LANGUAGES.find((l) => l.code === code);
  if (!found) throw new Error(`Unsupported language: ${code}`);
  return found;
}
