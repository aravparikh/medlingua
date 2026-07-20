/**
 * Tappable body regions for the pain pointer. Names are pre-translated so the
 * feature works fully offline (device TTS covers the audio), and phrased to
 * slot into the `myHurtsPain` template — "It hurts here: {part}." — which
 * sidesteps gender/plural agreement in every language.
 */
export type BodyRegionId =
  | 'head'
  | 'neck'
  | 'chest'
  | 'stomach'
  | 'hips'
  | 'leftArm'
  | 'rightArm'
  | 'leftHand'
  | 'rightHand'
  | 'leftLeg'
  | 'rightLeg'
  | 'knees'
  | 'feet'
  | 'upperBack'
  | 'lowerBack';

export interface BodyRegion {
  id: BodyRegionId;
  /** Region name per language code, article included where the grammar wants one. */
  name: Record<string, string>;
}

export const BODY_REGIONS: Record<BodyRegionId, BodyRegion> = {
  head: {
    id: 'head',
    name: { en: 'my head', es: 'la cabeza', zh: '头', vi: 'đầu', ru: 'голова', hi: 'सिर', pa: 'ਸਿਰ' },
  },
  neck: {
    id: 'neck',
    name: { en: 'my neck', es: 'el cuello', zh: '脖子', vi: 'cổ', ru: 'шея', hi: 'गर्दन', pa: 'ਗਰਦਨ' },
  },
  chest: {
    id: 'chest',
    name: { en: 'my chest', es: 'el pecho', zh: '胸口', vi: 'ngực', ru: 'грудь', hi: 'सीना', pa: 'ਛਾਤੀ' },
  },
  stomach: {
    id: 'stomach',
    name: { en: 'my stomach', es: 'el estómago', zh: '肚子', vi: 'bụng', ru: 'живот', hi: 'पेट', pa: 'ਢਿੱਡ' },
  },
  hips: {
    id: 'hips',
    name: { en: 'my hips', es: 'las caderas', zh: '髋部', vi: 'hông', ru: 'таз', hi: 'कूल्हे', pa: 'ਕੁੱਲ੍ਹੇ' },
  },
  leftArm: {
    id: 'leftArm',
    name: { en: 'my left arm', es: 'el brazo izquierdo', zh: '左臂', vi: 'cánh tay trái', ru: 'левая рука', hi: 'बायीं बाँह', pa: 'ਖੱਬੀ ਬਾਂਹ' },
  },
  rightArm: {
    id: 'rightArm',
    name: { en: 'my right arm', es: 'el brazo derecho', zh: '右臂', vi: 'cánh tay phải', ru: 'правая рука', hi: 'दायीं बाँह', pa: 'ਸੱਜੀ ਬਾਂਹ' },
  },
  leftHand: {
    id: 'leftHand',
    name: { en: 'my left hand', es: 'la mano izquierda', zh: '左手', vi: 'bàn tay trái', ru: 'левая кисть', hi: 'बायाँ हाथ', pa: 'ਖੱਬਾ ਹੱਥ' },
  },
  rightHand: {
    id: 'rightHand',
    name: { en: 'my right hand', es: 'la mano derecha', zh: '右手', vi: 'bàn tay phải', ru: 'правая кисть', hi: 'दायाँ हाथ', pa: 'ਸੱਜਾ ਹੱਥ' },
  },
  leftLeg: {
    id: 'leftLeg',
    name: { en: 'my left leg', es: 'la pierna izquierda', zh: '左腿', vi: 'chân trái', ru: 'левая нога', hi: 'बायीं टाँग', pa: 'ਖੱਬੀ ਲੱਤ' },
  },
  rightLeg: {
    id: 'rightLeg',
    name: { en: 'my right leg', es: 'la pierna derecha', zh: '右腿', vi: 'chân phải', ru: 'правая нога', hi: 'दायीं टाँग', pa: 'ਸੱਜੀ ਲੱਤ' },
  },
  knees: {
    id: 'knees',
    name: { en: 'my knees', es: 'las rodillas', zh: '膝盖', vi: 'đầu gối', ru: 'колени', hi: 'घुटने', pa: 'ਗੋਡੇ' },
  },
  feet: {
    id: 'feet',
    name: { en: 'my feet', es: 'los pies', zh: '脚', vi: 'bàn chân', ru: 'стопы', hi: 'पैर', pa: 'ਪੈਰ' },
  },
  upperBack: {
    id: 'upperBack',
    name: { en: 'my upper back', es: 'la parte alta de la espalda', zh: '上背部', vi: 'lưng trên', ru: 'верх спины', hi: 'ऊपरी पीठ', pa: 'ਉੱਪਰਲੀ ਪਿੱਠ' },
  },
  lowerBack: {
    id: 'lowerBack',
    name: { en: 'my lower back', es: 'la parte baja de la espalda', zh: '腰部', vi: 'thắt lưng', ru: 'поясница', hi: 'कमर', pa: 'ਲੱਕ' },
  },
};
