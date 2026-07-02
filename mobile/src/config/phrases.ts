import type { Ionicons } from '@expo/vector-icons';

/**
 * Pre-translated quick phrases for common clinical moments. Because these are
 * translated ahead of time, they work instantly and with zero connectivity
 * (on-device speech covers the audio when the network is down).
 *
 * `text` is keyed by language code and must include 'en' plus every language
 * in src/config/languages.ts.
 */
export interface Phrase {
  id: string;
  /** Ionicons icon name (vector icons only — no emoji glyphs in the UI). */
  icon: keyof typeof Ionicons.glyphMap;
  text: Record<string, string>;
}

/** Spoken by the English speaker (clinician) → translated for the patient. */
export const CLINICIAN_PHRASES: Phrase[] = [
  {
    id: 'where-hurt',
    icon: 'body-outline',
    text: {
      en: 'Where does it hurt?',
      es: '¿Dónde le duele?',
      zh: '哪里疼？',
      vi: 'Bạn đau ở đâu?',
      ru: 'Где у вас болит?',
    },
  },
  {
    id: 'pain-scale',
    icon: 'speedometer-outline',
    text: {
      en: 'Rate your pain from 1 to 10.',
      es: 'Del 1 al 10, ¿cuánto le duele?',
      zh: '请给您的疼痛打分，从1到10。',
      vi: 'Hãy đánh giá cơn đau của bạn từ 1 đến 10.',
      ru: 'Оцените вашу боль от 1 до 10.',
    },
  },
  {
    id: 'allergies',
    icon: 'alert-circle-outline',
    text: {
      en: 'Are you allergic to any medications?',
      es: '¿Es alérgico a algún medicamento?',
      zh: '您对任何药物过敏吗？',
      vi: 'Bạn có dị ứng với thuốc nào không?',
      ru: 'У вас есть аллергия на какие-нибудь лекарства?',
    },
  },
  {
    id: 'current-meds',
    icon: 'medkit-outline',
    text: {
      en: 'What medications are you taking?',
      es: '¿Qué medicamentos está tomando?',
      zh: '您正在服用什么药物？',
      vi: 'Bạn đang dùng những loại thuốc nào?',
      ru: 'Какие лекарства вы принимаете?',
    },
  },
  {
    id: 'when-start',
    icon: 'time-outline',
    text: {
      en: 'When did this start?',
      es: '¿Cuándo empezó esto?',
      zh: '这是什么时候开始的？',
      vi: 'Tình trạng này bắt đầu từ khi nào?',
      ru: 'Когда это началось?',
    },
  },
  {
    id: 'dosage',
    icon: 'restaurant-outline',
    text: {
      en: 'Take this medicine twice a day with food.',
      es: 'Tome este medicamento dos veces al día con comida.',
      zh: '这种药每天服用两次，随餐服用。',
      vi: 'Uống thuốc này hai lần mỗi ngày cùng với thức ăn.',
      ru: 'Принимайте это лекарство два раза в день во время еды.',
    },
  },
];

/**
 * Emergency phrases, spoken by the patient → translated into English.
 * Shown first in the sheet with urgent styling; work fully offline.
 */
export const EMERGENCY_PHRASES: Phrase[] = [
  {
    id: 'cant-breathe',
    icon: 'pulse-outline',
    text: {
      en: "I can't breathe.",
      es: 'No puedo respirar.',
      zh: '我无法呼吸。',
      vi: 'Tôi không thở được.',
      ru: 'Я не могу дышать.',
    },
  },
  {
    id: 'chest-pain',
    icon: 'heart-outline',
    text: {
      en: 'I have chest pain.',
      es: 'Me duele el pecho.',
      zh: '我胸口疼。',
      vi: 'Tôi bị đau ngực.',
      ru: 'У меня болит в груди.',
    },
  },
  {
    id: 'need-help',
    icon: 'hand-right-outline',
    text: {
      en: 'I need help now.',
      es: 'Necesito ayuda ahora.',
      zh: '我现在需要帮助。',
      vi: 'Tôi cần giúp đỡ ngay bây giờ.',
      ru: 'Мне срочно нужна помощь.',
    },
  },
  {
    id: 'call-family',
    icon: 'call-outline',
    text: {
      en: 'Please call my family.',
      es: 'Llame a mi familia, por favor.',
      zh: '请打电话给我的家人。',
      vi: 'Xin hãy gọi cho gia đình tôi.',
      ru: 'Пожалуйста, позвоните моей семье.',
    },
  },
];

/** Spoken by the patient → translated into English. */
export const PATIENT_PHRASES: Phrase[] = [
  {
    id: 'yes',
    icon: 'checkmark-circle-outline',
    text: { en: 'Yes.', es: 'Sí.', zh: '是。', vi: 'Vâng.', ru: 'Да.' },
  },
  {
    id: 'no',
    icon: 'close-circle-outline',
    text: { en: 'No.', es: 'No.', zh: '不是。', vi: 'Không.', ru: 'Нет.' },
  },
  {
    id: 'dont-understand',
    icon: 'help-circle-outline',
    text: {
      en: "I don't understand.",
      es: 'No entiendo.',
      zh: '我不明白。',
      vi: 'Tôi không hiểu.',
      ru: 'Я не понимаю.',
    },
  },
  {
    id: 'please-repeat',
    icon: 'repeat-outline',
    text: {
      en: 'Please repeat that.',
      es: 'Repita, por favor.',
      zh: '请再说一遍。',
      vi: 'Xin nhắc lại.',
      ru: 'Повторите, пожалуйста.',
    },
  },
];
