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
  doneLabel: string;
  cancel: string;
  speakLouder: string;
  didntCatch: string;
  connectionError: string;
  notReady: string;
  tryAgain: string;
  micPermission: string;
  mayHaveMisheard: string;
  aiDisclaimer: string;
  /** AI/data-sharing disclosure shown with the first-run notice and in About. */
  dataConsent: string;
  privacyPolicy: string;
  termsLabel: string;
  ok: string;
  emergency: string;
  painScaleLabel: string;
  /** Template — {n} is replaced with the chosen 0-10 pain number. */
  painIs: string;
  quickPhrases: string;
  /** Short form for the narrow toolbar chip; the sheet title uses the full form. */
  quickPhrasesShort: string;
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
  // F1 — fullscreen translation
  fullscreen: string;
  tapToClose: string;
  // F2 — teach-back comprehension check
  checkLabel: string;
  didYouUnderstand: string;
  yes: string;
  no: string;
  simplifying: string;
  explainAgain: string;
  askInterpreter: string;
  // F3 — ephemeral visit summary
  summary: string;
  summaryEphemeral: string;
  generatingSummary: string;
  copy: string;
  copied: string;
  share: string;
  // F4 — body-map pain pointer. {part}/{n} are template slots.
  whereHurts: string;
  bodyMapHint: string;
  frontLabel: string;
  backLabel: string;
  howMuchHurt: string;
  sayIt: string;
  myHurtsPain: string;
  // F5 — medication label scanner
  scanLabel: string;
  scanTitle: string;
  scanReading: string;
  scanUnreadable: string;
  scanMedName: string;
  scanDose: string;
  scanWhen: string;
  scanWarnings: string;
  pharmacistLine: string;
  speakAloud: string;
  cameraPermission: string;
}

export const STRINGS: Record<string, UIStrings> = {
  en: {
    listening: 'Listening…',
    translating: 'Translating…',
    playing: 'Playing…',
    playAgain: 'Play again',
    youSaid: 'You said',
    translationLabel: 'Translation',
    holdAndSpeak: 'Tap your button and speak',
    tapWhenDone: 'Tap when finished',
    doneLabel: 'Done',
    cancel: 'Cancel',
    speakLouder: 'Speak louder or move closer',
    didntCatch: "I didn't catch that — tap and try again.",
    connectionError: "Couldn't connect — please try again.",
    notReady: 'Translation is not available right now.',
    tryAgain: 'Try again',
    micPermission: 'MedLingua needs the microphone to hear you. Please allow microphone access in Settings.',
    mayHaveMisheard: 'I may have misheard — please try again.',
    aiDisclaimer: 'AI translation can make mistakes. For important medical decisions, ask for a certified interpreter.',
    dataConsent: 'To translate, your voice, photos, and words are sent securely to OpenAI for processing. MedLingua never stores them.',
    privacyPolicy: 'Privacy policy',
    termsLabel: 'Terms of use',
    ok: 'OK',
    emergency: 'Emergency',
    painScaleLabel: 'Pain scale',
    painIs: 'My pain is {n} out of 10.',
    quickPhrases: 'Quick phrases',
    quickPhrasesShort: 'Phrases',
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
    fullscreen: 'Fullscreen',
    tapToClose: 'Tap to close',
    checkLabel: 'Check',
    didYouUnderstand: 'Did you understand?',
    yes: 'Yes',
    no: 'No',
    simplifying: 'Making it simpler…',
    explainAgain: 'Please explain it again, more simply.',
    askInterpreter: 'Still unclear — you have the right to a free medical interpreter. Please ask the staff.',
    summary: 'Summary',
    summaryEphemeral: 'This summary disappears when the timer ends — copy it somewhere safe now.',
    generatingSummary: 'Creating summary…',
    copy: 'Copy',
    copied: 'Copied!',
    share: 'Share',
    whereHurts: 'Where does it hurt?',
    bodyMapHint: 'Tap the body where it hurts',
    frontLabel: 'Front',
    backLabel: 'Back',
    howMuchHurt: 'How much does it hurt?',
    sayIt: 'Say it',
    myHurtsPain: 'It hurts here: {part}. The pain is {n} out of 10.',
    scanLabel: 'Scan',
    scanTitle: 'Medication label',
    scanReading: 'Reading the label…',
    scanUnreadable: "Couldn't read the label — try again with more light, closer up.",
    scanMedName: 'Medication',
    scanDose: 'How much',
    scanWhen: 'When',
    scanWarnings: 'Warnings',
    pharmacistLine: 'Please confirm with your pharmacist.',
    speakAloud: 'Read aloud',
    cameraPermission: 'MedLingua needs the camera to read the label. Please allow camera access in Settings.',
  },
  es: {
    listening: 'Escuchando…',
    translating: 'Traduciendo…',
    playing: 'Reproduciendo…',
    playAgain: 'Repetir',
    youSaid: 'Usted dijo',
    translationLabel: 'Traducción',
    holdAndSpeak: 'Toque su botón y hable',
    tapWhenDone: 'Toque al terminar',
    doneLabel: 'Listo',
    cancel: 'Cancelar',
    speakLouder: 'Hable más fuerte o acérquese',
    didntCatch: 'No escuché bien. Toque y vuelva a intentarlo.',
    connectionError: 'No se pudo conectar. Vuelva a intentarlo.',
    notReady: 'La traducción no está disponible en este momento.',
    tryAgain: 'Reintentar',
    micPermission: 'MedLingua necesita el micrófono para escucharle. Permita el acceso al micrófono en Ajustes.',
    mayHaveMisheard: 'Puede que no haya oído bien. Inténtelo de nuevo.',
    aiDisclaimer: 'La traducción con IA puede cometer errores. Para decisiones médicas importantes, pida un intérprete certificado.',
    dataConsent: 'Para traducir, su voz, sus fotos y sus palabras se envían de forma segura a OpenAI para su procesamiento. MedLingua nunca las guarda.',
    privacyPolicy: 'Política de privacidad',
    termsLabel: 'Términos de uso',
    ok: 'Entendido',
    emergency: 'Emergencia',
    painScaleLabel: 'Escala de dolor',
    painIs: 'Mi dolor es {n} de 10.',
    quickPhrases: 'Frases rápidas',
    quickPhrasesShort: 'Frases',
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
    fullscreen: 'Pantalla completa',
    tapToClose: 'Toque para cerrar',
    checkLabel: '¿Entendió?',
    didYouUnderstand: '¿Lo entendió?',
    yes: 'Sí',
    no: 'No',
    simplifying: 'Explicándolo más simple…',
    explainAgain: 'Por favor, explíquelo otra vez, más simple.',
    askInterpreter: 'Aún no está claro — usted tiene derecho a un intérprete médico gratuito. Pídalo al personal.',
    summary: 'Resumen',
    summaryEphemeral: 'Este resumen desaparecerá cuando termine el tiempo — cópielo ahora en un lugar seguro.',
    generatingSummary: 'Creando el resumen…',
    copy: 'Copiar',
    copied: '¡Copiado!',
    share: 'Compartir',
    whereHurts: '¿Dónde le duele?',
    bodyMapHint: 'Toque el cuerpo donde le duele',
    frontLabel: 'Frente',
    backLabel: 'Espalda',
    howMuchHurt: '¿Cuánto le duele?',
    sayIt: 'Decirlo',
    myHurtsPain: 'Me duele aquí: {part}. El dolor es {n} de 10.',
    scanLabel: 'Escanear',
    scanTitle: 'Etiqueta del medicamento',
    scanReading: 'Leyendo la etiqueta…',
    scanUnreadable: 'No se pudo leer la etiqueta. Inténtelo de nuevo con más luz y más cerca.',
    scanMedName: 'Medicamento',
    scanDose: 'Cuánto',
    scanWhen: 'Cuándo',
    scanWarnings: 'Advertencias',
    pharmacistLine: 'Confirme con su farmacéutico, por favor.',
    speakAloud: 'Leer en voz alta',
    cameraPermission: 'MedLingua necesita la cámara para leer la etiqueta. Permita el acceso a la cámara en Ajustes.',
  },
  zh: {
    listening: '正在聆听…',
    translating: '正在翻译…',
    playing: '正在播放…',
    playAgain: '再听一遍',
    youSaid: '您说',
    translationLabel: '翻译',
    holdAndSpeak: '点击您的按钮说话',
    tapWhenDone: '说完后再点一下',
    doneLabel: '完成',
    cancel: '取消',
    speakLouder: '请大声一点或靠近一些',
    didntCatch: '没有听清，请点击后再试一次。',
    connectionError: '无法连接，请再试一次。',
    notReady: '目前无法使用翻译。',
    tryAgain: '重试',
    micPermission: 'MedLingua 需要使用麦克风才能听到您说话。请在“设置”中允许使用麦克风。',
    mayHaveMisheard: '我可能没有听清，请再试一次。',
    aiDisclaimer: 'AI 翻译可能出错。涉及重要医疗决定时，请要求专业医疗口译员。',
    dataConsent: '为了翻译，您的语音、照片和文字会安全地发送给 OpenAI 进行处理。MedLingua 绝不会保存它们。',
    privacyPolicy: '隐私政策',
    termsLabel: '使用条款',
    ok: '好的',
    emergency: '紧急情况',
    painScaleLabel: '疼痛等级',
    painIs: '我的疼痛程度是{n}分（满分10分）。',
    quickPhrases: '常用短语',
    quickPhrasesShort: '短语',
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
    fullscreen: '全屏',
    tapToClose: '点按关闭',
    checkLabel: '听懂了吗？',
    didYouUnderstand: '您听懂了吗？',
    yes: '是',
    no: '否',
    simplifying: '正在简化说明…',
    explainAgain: '请再解释一次，说得更简单些。',
    askInterpreter: '仍然不清楚——您有权获得免费的医疗口译员，请向工作人员提出。',
    summary: '摘要',
    summaryEphemeral: '计时结束后此摘要将消失——请立即复制保存到安全的地方。',
    generatingSummary: '正在生成摘要…',
    copy: '复制',
    copied: '已复制！',
    share: '分享',
    whereHurts: '哪里疼？',
    bodyMapHint: '请点身体上疼的部位',
    frontLabel: '正面',
    backLabel: '背面',
    howMuchHurt: '有多疼？',
    sayIt: '说出来',
    myHurtsPain: '我这里疼：{part}。疼痛程度是10分中的{n}分。',
    scanLabel: '扫描',
    scanTitle: '药品标签',
    scanReading: '正在读取标签…',
    scanUnreadable: '无法读取标签——请在光线更好的地方靠近再拍一次。',
    scanMedName: '药品',
    scanDose: '用量',
    scanWhen: '何时服用',
    scanWarnings: '注意事项',
    pharmacistLine: '请与药剂师确认。',
    speakAloud: '朗读',
    cameraPermission: 'MedLingua 需要使用相机来读取标签。请在“设置”中允许使用相机。',
  },
  vi: {
    listening: 'Đang nghe…',
    translating: 'Đang dịch…',
    playing: 'Đang phát…',
    playAgain: 'Nghe lại',
    youSaid: 'Bạn đã nói',
    translationLabel: 'Bản dịch',
    holdAndSpeak: 'Chạm nút của bạn và nói',
    tapWhenDone: 'Chạm khi nói xong',
    doneLabel: 'Xong',
    cancel: 'Hủy',
    speakLouder: 'Nói to hơn hoặc lại gần hơn',
    didntCatch: 'Tôi chưa nghe rõ — hãy chạm và thử lại.',
    connectionError: 'Không thể kết nối — vui lòng thử lại.',
    notReady: 'Hiện không thể dịch được.',
    tryAgain: 'Thử lại',
    micPermission: 'MedLingua cần micrô để nghe bạn nói. Vui lòng cho phép truy cập micrô trong Cài đặt.',
    mayHaveMisheard: 'Có thể tôi đã nghe nhầm — hãy thử lại.',
    aiDisclaimer: 'Bản dịch AI có thể sai. Với các quyết định y tế quan trọng, hãy yêu cầu thông dịch viên có chứng nhận.',
    dataConsent: 'Để dịch, giọng nói, ảnh và lời của bạn được gửi an toàn đến OpenAI để xử lý. MedLingua không bao giờ lưu chúng.',
    privacyPolicy: 'Chính sách bảo mật',
    termsLabel: 'Điều khoản sử dụng',
    ok: 'Đã hiểu',
    emergency: 'Khẩn cấp',
    painScaleLabel: 'Mức độ đau',
    painIs: 'Cơn đau của tôi là {n} trên 10.',
    quickPhrases: 'Câu thường dùng',
    quickPhrasesShort: 'Câu nói',
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
    fullscreen: 'Toàn màn hình',
    tapToClose: 'Chạm để đóng',
    checkLabel: 'Hiểu chưa?',
    didYouUnderstand: 'Bạn có hiểu không?',
    yes: 'Có',
    no: 'Không',
    simplifying: 'Đang giải thích đơn giản hơn…',
    explainAgain: 'Xin giải thích lại, đơn giản hơn.',
    askInterpreter: 'Vẫn chưa rõ — bạn có quyền được thông dịch viên y tế miễn phí. Hãy hỏi nhân viên.',
    summary: 'Tóm tắt',
    summaryEphemeral: 'Bản tóm tắt này sẽ biến mất khi hết giờ — hãy sao chép ngay vào nơi an toàn.',
    generatingSummary: 'Đang tạo tóm tắt…',
    copy: 'Sao chép',
    copied: 'Đã sao chép!',
    share: 'Chia sẻ',
    whereHurts: 'Bạn đau ở đâu?',
    bodyMapHint: 'Chạm vào chỗ đau trên cơ thể',
    frontLabel: 'Mặt trước',
    backLabel: 'Mặt sau',
    howMuchHurt: 'Đau đến mức nào?',
    sayIt: 'Nói ra',
    myHurtsPain: 'Tôi đau ở đây: {part}. Mức đau là {n} trên 10.',
    scanLabel: 'Quét',
    scanTitle: 'Nhãn thuốc',
    scanReading: 'Đang đọc nhãn…',
    scanUnreadable: 'Không đọc được nhãn — hãy thử lại với ánh sáng tốt hơn và chụp gần hơn.',
    scanMedName: 'Thuốc',
    scanDose: 'Liều lượng',
    scanWhen: 'Khi nào',
    scanWarnings: 'Cảnh báo',
    pharmacistLine: 'Vui lòng xác nhận với dược sĩ.',
    speakAloud: 'Đọc to',
    cameraPermission: 'MedLingua cần máy ảnh để đọc nhãn. Vui lòng cho phép truy cập máy ảnh trong Cài đặt.',
  },
  ru: {
    listening: 'Слушаю…',
    translating: 'Перевожу…',
    playing: 'Воспроизведение…',
    playAgain: 'Повторить',
    youSaid: 'Вы сказали',
    translationLabel: 'Перевод',
    holdAndSpeak: 'Нажмите свою кнопку и говорите',
    tapWhenDone: 'Нажмите, когда закончите',
    doneLabel: 'Готово',
    cancel: 'Отмена',
    speakLouder: 'Говорите громче или ближе',
    didntCatch: 'Я не расслышал — нажмите и попробуйте ещё раз.',
    connectionError: 'Не удалось подключиться — попробуйте ещё раз.',
    notReady: 'Перевод сейчас недоступен.',
    tryAgain: 'Попробовать снова',
    micPermission: 'MedLingua нужен микрофон, чтобы вас слышать. Разрешите доступ к микрофону в Настройках.',
    mayHaveMisheard: 'Возможно, я расслышал неверно — попробуйте ещё раз.',
    aiDisclaimer: 'ИИ-перевод может ошибаться. Для важных медицинских решений попросите сертифицированного переводчика.',
    dataConsent: 'Для перевода ваш голос, фото и слова безопасно передаются в OpenAI для обработки. MedLingua никогда их не сохраняет.',
    privacyPolicy: 'Политика конфиденциальности',
    termsLabel: 'Условия использования',
    ok: 'Понятно',
    emergency: 'Срочно',
    painScaleLabel: 'Шкала боли',
    painIs: 'Моя боль — {n} из 10.',
    quickPhrases: 'Частые фразы',
    quickPhrasesShort: 'Фразы',
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
    fullscreen: 'Во весь экран',
    tapToClose: 'Нажмите, чтобы закрыть',
    checkLabel: 'Понятно?',
    didYouUnderstand: 'Вы поняли?',
    yes: 'Да',
    no: 'Нет',
    simplifying: 'Объясняю проще…',
    explainAgain: 'Пожалуйста, объясните ещё раз, проще.',
    askInterpreter: 'Всё ещё непонятно — вы имеете право на бесплатного медицинского переводчика. Обратитесь к персоналу.',
    summary: 'Сводка',
    summaryEphemeral: 'Сводка исчезнет, когда закончится время — скопируйте её сейчас в надёжное место.',
    generatingSummary: 'Создаю сводку…',
    copy: 'Копировать',
    copied: 'Скопировано!',
    share: 'Поделиться',
    whereHurts: 'Где болит?',
    bodyMapHint: 'Коснитесь места на теле, где болит',
    frontLabel: 'Спереди',
    backLabel: 'Сзади',
    howMuchHurt: 'Насколько сильно болит?',
    sayIt: 'Озвучить',
    myHurtsPain: 'У меня болит здесь: {part}. Боль — {n} из 10.',
    scanLabel: 'Скан',
    scanTitle: 'Этикетка лекарства',
    scanReading: 'Читаю этикетку…',
    scanUnreadable: 'Не удалось прочитать этикетку — попробуйте ещё раз при лучшем освещении и ближе.',
    scanMedName: 'Лекарство',
    scanDose: 'Дозировка',
    scanWhen: 'Когда',
    scanWarnings: 'Предупреждения',
    pharmacistLine: 'Пожалуйста, уточните у фармацевта.',
    speakAloud: 'Прочитать вслух',
    cameraPermission: 'MedLingua нужна камера, чтобы прочитать этикетку. Разрешите доступ к камере в Настройках.',
  },
};

export function t(code: string): UIStrings {
  return STRINGS[code] ?? STRINGS.en;
}
