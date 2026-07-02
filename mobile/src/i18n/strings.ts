/**
 * UI strings for every supported language, keyed by language code.
 * Every user-facing string lives here so the whole app — including errors and
 * onboarding — works without reading English.
 *
 * When adding a language to src/config/languages.ts, add its strings here too.
 */
export interface UIStrings {
  listening: string;
  translating: string;
  playing: string;
  playAgain: string;
  youSaid: string;
  translationLabel: string;
  holdAndSpeak: string;
  tapWhenDone: string;
  didntCatch: string;
  connectionError: string;
  notReady: string;
  tryAgain: string;
  micPermission: string;
  mayHaveMisheard: string;
  aiDisclaimer: string;
  ok: string;
  emergency: string;
  painScaleLabel: string;
  /** Template — {n} is replaced with the chosen 0-10 pain number. */
  painIs: string;
  quickPhrases: string;
  close: string;
  auto: string;
  speakAuto: string;
  flip: string;
  typeLabel: string;
  typePlaceholder: string;
  privacyLine: string;
  changeLanguage: string;
  languageShort: string;
  chooseLanguage: string;
  about: string;
  aboutShort: string;
  aboutBody: string;
  back: string;
}

export const STRINGS: Record<string, UIStrings> = {
  en: {
    listening: 'Listening…',
    translating: 'Translating…',
    playing: 'Playing…',
    playAgain: 'Play again',
    youSaid: 'You said',
    translationLabel: 'Translation',
    holdAndSpeak: 'Hold your button and speak',
    tapWhenDone: 'Tap when finished',
    didntCatch: "I didn't catch that — tap and try again.",
    connectionError: "Couldn't connect — please try again.",
    notReady: 'Translation is not available right now.',
    tryAgain: 'Try again',
    micPermission: 'MedLingua needs the microphone to hear you. Please allow microphone access in Settings.',
    mayHaveMisheard: 'I may have misheard — please try again.',
    aiDisclaimer: 'AI translation can make mistakes. For important medical decisions, ask for a certified interpreter.',
    ok: 'OK',
    emergency: 'Emergency',
    painScaleLabel: 'Pain scale',
    painIs: 'My pain is {n} out of 10.',
    quickPhrases: 'Quick phrases',
    close: 'Close',
    auto: 'Auto',
    speakAuto: 'Speak',
    flip: 'Show',
    typeLabel: 'Type',
    typePlaceholder: 'Type here…',
    privacyLine: 'Your conversation is private — nothing is saved.',
    changeLanguage: 'Change language',
    languageShort: 'Language',
    chooseLanguage: 'Choose your language',
    about: 'About & privacy',
    aboutShort: 'Privacy',
    aboutBody:
      'MedLingua helps two people who speak different languages talk to each other during a medical visit.\n\nYour conversation is private. Nothing you say is saved, stored, or shared — everything is translated in the moment and then forgotten.',
    back: 'Back',
  },
  es: {
    listening: 'Escuchando…',
    translating: 'Traduciendo…',
    playing: 'Reproduciendo…',
    playAgain: 'Repetir',
    youSaid: 'Usted dijo',
    translationLabel: 'Traducción',
    holdAndSpeak: 'Mantenga pulsado su botón y hable',
    tapWhenDone: 'Toque al terminar',
    didntCatch: 'No escuché bien. Toque y vuelva a intentarlo.',
    connectionError: 'No se pudo conectar. Vuelva a intentarlo.',
    notReady: 'La traducción no está disponible en este momento.',
    tryAgain: 'Reintentar',
    micPermission: 'MedLingua necesita el micrófono para escucharle. Permita el acceso al micrófono en Ajustes.',
    mayHaveMisheard: 'Puede que no haya oído bien. Inténtelo de nuevo.',
    aiDisclaimer: 'La traducción con IA puede cometer errores. Para decisiones médicas importantes, pida un intérprete certificado.',
    ok: 'Entendido',
    emergency: 'Emergencia',
    painScaleLabel: 'Escala de dolor',
    painIs: 'Mi dolor es {n} de 10.',
    quickPhrases: 'Frases rápidas',
    close: 'Cerrar',
    auto: 'Automático',
    speakAuto: 'Hablar',
    flip: 'Mostrar',
    typeLabel: 'Escribir',
    typePlaceholder: 'Escriba aquí…',
    privacyLine: 'Su conversación es privada — no se guarda nada.',
    changeLanguage: 'Cambiar idioma',
    languageShort: 'Idioma',
    chooseLanguage: 'Elija su idioma',
    about: 'Información y privacidad',
    aboutShort: 'Privacidad',
    aboutBody:
      'MedLingua ayuda a dos personas que hablan idiomas distintos a conversar durante una visita médica.\n\nSu conversación es privada. Nada de lo que diga se guarda, almacena ni comparte: todo se traduce en el momento y luego se olvida.',
    back: 'Atrás',
  },
  zh: {
    listening: '正在聆听…',
    translating: '正在翻译…',
    playing: '正在播放…',
    playAgain: '再听一遍',
    youSaid: '您说',
    translationLabel: '翻译',
    holdAndSpeak: '按住您的按钮说话',
    tapWhenDone: '说完后再点一下',
    didntCatch: '没有听清，请点击后再试一次。',
    connectionError: '无法连接，请再试一次。',
    notReady: '目前无法使用翻译。',
    tryAgain: '重试',
    micPermission: 'MedLingua 需要使用麦克风才能听到您说话。请在“设置”中允许使用麦克风。',
    mayHaveMisheard: '我可能没有听清，请再试一次。',
    aiDisclaimer: 'AI 翻译可能出错。涉及重要医疗决定时，请要求专业医疗口译员。',
    ok: '好的',
    emergency: '紧急情况',
    painScaleLabel: '疼痛等级',
    painIs: '我的疼痛程度是{n}分（满分10分）。',
    quickPhrases: '常用短语',
    close: '关闭',
    auto: '自动',
    speakAuto: '说话',
    flip: '展示',
    typeLabel: '输入',
    typePlaceholder: '在这里输入…',
    privacyLine: '您的对话是私密的——不会保存任何内容。',
    changeLanguage: '更换语言',
    languageShort: '语言',
    chooseLanguage: '选择您的语言',
    about: '关于与隐私',
    aboutShort: '隐私',
    aboutBody:
      'MedLingua 帮助说不同语言的两个人在就诊时相互交流。\n\n您的对话是私密的。您所说的内容不会被保存、存储或分享——一切都是即时翻译，随后即被遗忘。',
    back: '返回',
  },
  vi: {
    listening: 'Đang nghe…',
    translating: 'Đang dịch…',
    playing: 'Đang phát…',
    playAgain: 'Nghe lại',
    youSaid: 'Bạn đã nói',
    translationLabel: 'Bản dịch',
    holdAndSpeak: 'Giữ nút của bạn và nói',
    tapWhenDone: 'Chạm khi nói xong',
    didntCatch: 'Tôi chưa nghe rõ — hãy chạm và thử lại.',
    connectionError: 'Không thể kết nối — vui lòng thử lại.',
    notReady: 'Hiện không thể dịch được.',
    tryAgain: 'Thử lại',
    micPermission: 'MedLingua cần micrô để nghe bạn nói. Vui lòng cho phép truy cập micrô trong Cài đặt.',
    mayHaveMisheard: 'Có thể tôi đã nghe nhầm — hãy thử lại.',
    aiDisclaimer: 'Bản dịch AI có thể sai. Với các quyết định y tế quan trọng, hãy yêu cầu thông dịch viên có chứng nhận.',
    ok: 'Đã hiểu',
    emergency: 'Khẩn cấp',
    painScaleLabel: 'Mức độ đau',
    painIs: 'Cơn đau của tôi là {n} trên 10.',
    quickPhrases: 'Câu thường dùng',
    close: 'Đóng',
    auto: 'Tự động',
    speakAuto: 'Nói',
    flip: 'Cho xem',
    typeLabel: 'Nhập',
    typePlaceholder: 'Nhập tại đây…',
    privacyLine: 'Cuộc trò chuyện của bạn là riêng tư — không có gì được lưu lại.',
    changeLanguage: 'Đổi ngôn ngữ',
    languageShort: 'Ngôn ngữ',
    chooseLanguage: 'Chọn ngôn ngữ của bạn',
    about: 'Giới thiệu & quyền riêng tư',
    aboutShort: 'Riêng tư',
    aboutBody:
      'MedLingua giúp hai người nói hai ngôn ngữ khác nhau trò chuyện với nhau trong buổi khám bệnh.\n\nCuộc trò chuyện của bạn là riêng tư. Những gì bạn nói không được lưu, không được cất giữ hay chia sẻ — mọi thứ được dịch ngay lúc đó rồi bị quên đi.',
    back: 'Quay lại',
  },
  ru: {
    listening: 'Слушаю…',
    translating: 'Перевожу…',
    playing: 'Воспроизведение…',
    playAgain: 'Повторить',
    youSaid: 'Вы сказали',
    translationLabel: 'Перевод',
    holdAndSpeak: 'Удерживайте свою кнопку и говорите',
    tapWhenDone: 'Нажмите, когда закончите',
    didntCatch: 'Я не расслышал — нажмите и попробуйте ещё раз.',
    connectionError: 'Не удалось подключиться — попробуйте ещё раз.',
    notReady: 'Перевод сейчас недоступен.',
    tryAgain: 'Попробовать снова',
    micPermission: 'MedLingua нужен микрофон, чтобы вас слышать. Разрешите доступ к микрофону в Настройках.',
    mayHaveMisheard: 'Возможно, я расслышал неверно — попробуйте ещё раз.',
    aiDisclaimer: 'ИИ-перевод может ошибаться. Для важных медицинских решений попросите сертифицированного переводчика.',
    ok: 'Понятно',
    emergency: 'Срочно',
    painScaleLabel: 'Шкала боли',
    painIs: 'Моя боль — {n} из 10.',
    quickPhrases: 'Частые фразы',
    close: 'Закрыть',
    auto: 'Авто',
    speakAuto: 'Говорите',
    flip: 'Показать',
    typeLabel: 'Печатать',
    typePlaceholder: 'Введите здесь…',
    privacyLine: 'Ваш разговор конфиденциален — ничего не сохраняется.',
    changeLanguage: 'Сменить язык',
    languageShort: 'Язык',
    chooseLanguage: 'Выберите свой язык',
    about: 'О приложении и конфиденциальность',
    aboutShort: 'Приватность',
    aboutBody:
      'MedLingua помогает двум людям, говорящим на разных языках, общаться друг с другом на приёме у врача.\n\nВаш разговор конфиденциален. Ничего из сказанного не сохраняется и не передаётся — всё переводится в момент разговора и затем забывается.',
    back: 'Назад',
  },
};

export function t(code: string): UIStrings {
  return STRINGS[code] ?? STRINGS.en;
}
