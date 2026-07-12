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
  /** One- or two-character native-script mark shown in tinted circles.
   * Deliberately not a flag: flags mark countries, not languages (a Mexican
   * Spanish speaker shouldn't have to rally behind 🇪🇸). */
  monogram: string;
  /** Language hint passed to Whisper for better transcription. */
  whisper: string;
  /** Whisper `prompt`: a short in-language sample of clinical vocabulary that
   * biases the model toward medical terms and correct spelling. Without it
   * Whisper guesses domain words cold ("ibuprofen", "hypertension", dosages)
   * and mis-hears far more often. */
  whisperPrompt: string;
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
  monogram: 'En',
  whisper: 'en',
  whisperPrompt:
    'A medical clinic conversation. Symptoms, pain level, allergies, medications and dosage, blood pressure, diabetes, ibuprofen, acetaminophen, twice a day with food. Medication names may include: lisinopril, amlodipine, metformin, atorvastatin, simvastatin, omeprazole, levothyroxine, losartan, albuterol, gabapentin, hydrochlorothiazide, metoprolol, sertraline, montelukast, furosemide, pantoprazole, escitalopram, amoxicillin, prednisone, insulin, warfarin, tramadol, aspirin, naproxen, azithromycin, ciprofloxacin, clopidogrel, tamsulosin.',
  speechTag: 'en-US',
  ttsVoice: 'alloy',
  speakLabel: 'Speak English',
};

export const LANGUAGES: Language[] = [
  {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    monogram: 'Es',
    whisper: 'es',
    whisperPrompt:
      'Una conversación en una clínica médica. Síntomas, nivel de dolor, alergias, medicamentos y dosis, presión arterial, diabetes, ibuprofeno, paracetamol, dos veces al día con comida. Los nombres de medicamentos pueden incluir: lisinopril, amlodipine, metformin, atorvastatin, simvastatin, omeprazole, levothyroxine, losartan, albuterol, gabapentin, hydrochlorothiazide, metoprolol, sertraline, montelukast, furosemide, pantoprazole, escitalopram, amoxicillin, prednisone, insulin, warfarin, tramadol, aspirin, naproxen, azithromycin, ciprofloxacin, clopidogrel, tamsulosin.',
    speechTag: 'es-MX',
    ttsVoice: 'nova',
    speakLabel: 'Hablar español',
  },
  {
    code: 'zh',
    nativeName: '中文',
    englishName: 'Chinese (Mandarin)',
    monogram: '中',
    whisper: 'zh',
    whisperPrompt:
      '一段医疗诊所的对话。症状、疼痛程度、过敏、药物和剂量、血压、糖尿病、布洛芬、对乙酰氨基酚、每天两次随餐服用。 药物名称可能包括： lisinopril, amlodipine, metformin, atorvastatin, simvastatin, omeprazole, levothyroxine, losartan, albuterol, gabapentin, hydrochlorothiazide, metoprolol, sertraline, montelukast, furosemide, pantoprazole, escitalopram, amoxicillin, prednisone, insulin, warfarin, tramadol, aspirin, naproxen, azithromycin, ciprofloxacin, clopidogrel, tamsulosin.',
    speechTag: 'zh-CN',
    ttsVoice: 'nova',
    speakLabel: '说中文',
  },
  {
    code: 'vi',
    nativeName: 'Tiếng Việt',
    englishName: 'Vietnamese',
    monogram: 'Vi',
    whisper: 'vi',
    whisperPrompt:
      'Một cuộc trò chuyện tại phòng khám. Triệu chứng, mức độ đau, dị ứng, thuốc và liều lượng, huyết áp, tiểu đường, ibuprofen, paracetamol, uống hai lần mỗi ngày cùng với thức ăn. Tên thuốc có thể bao gồm: lisinopril, amlodipine, metformin, atorvastatin, simvastatin, omeprazole, levothyroxine, losartan, albuterol, gabapentin, hydrochlorothiazide, metoprolol, sertraline, montelukast, furosemide, pantoprazole, escitalopram, amoxicillin, prednisone, insulin, warfarin, tramadol, aspirin, naproxen, azithromycin, ciprofloxacin, clopidogrel, tamsulosin.',
    speechTag: 'vi-VN',
    ttsVoice: 'nova',
    speakLabel: 'Nói tiếng Việt',
  },
  {
    code: 'ru',
    nativeName: 'Русский',
    englishName: 'Russian',
    monogram: 'Ру',
    whisper: 'ru',
    whisperPrompt:
      'Разговор в медицинской клинике. Симптомы, уровень боли, аллергия, лекарства и дозировка, артериальное давление, диабет, ибупрофен, парацетамол, два раза в день во время еды. Названия лекарств могут включать: lisinopril, amlodipine, metformin, atorvastatin, simvastatin, omeprazole, levothyroxine, losartan, albuterol, gabapentin, hydrochlorothiazide, metoprolol, sertraline, montelukast, furosemide, pantoprazole, escitalopram, amoxicillin, prednisone, insulin, warfarin, tramadol, aspirin, naproxen, azithromycin, ciprofloxacin, clopidogrel, tamsulosin.',
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
