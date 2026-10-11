import type { Widen } from "../types";

/** 도움말(/help) 화면의 틀. FAQ 질문과 답은 `lib/help/faq`(한국어)·`lib/help/faq-en`(영어)에 있다. */
export const ko = {
  helpPage: {
    title: "도움말",
    subtitle: "자주 묻는 질문과 문의하는 곳이에요.",
    contact: "문의하기",
    contactBody:
      "찾는 답이 없으면 메일로 알려 주세요. 오류라면 어느 화면에서 무엇을 눌렀는지 함께 적어 주시면 빨리 확인할 수 있어요.",
    mailApp: "메일 앱으로 문의하기",
    gmail: "Gmail로 쓰기",
    copyAddress: "주소 복사",
    copied: "복사했어요",
    mailFallback:
      "메일 앱이 열리지 않으면 ‘Gmail로 쓰기’를 누르거나, 주소를 복사해 쓰는 메일에서 보내 주세요.",
    privacyBefore: "개인정보에 관한 요청도 같은 주소로 받아요(",
    privacyLink: "개인정보처리방침",
    privacyAfter: ").",
    noContact: "아직 문의 창구를 정하지 못했어요.",
    mailSubject: "[SubSlash 문의] ",
    mailBody: (app: boolean) => `문의 내용:\n\n\n---\n사용 환경: ${app ? "앱" : "웹"}`,
    search: {
      label: "도움말 검색",
      placeholder: "무엇이 궁금하세요?",
      unavailable: "지금은 답할 수 없어요.",
      aiFound: "AI가 도움말에서 찾았어요",
      aiNone: "AI도 도움말에서 찾지 못했어요",
      aiEmpty: "도움말에 없는 내용이에요. 아래 ‘문의하기’로 알려 주세요.",
      closest: "가장 비슷한 질문",
      similar: "비슷할 수 있는 질문",
      noMatch: "비슷한 질문을 찾지 못했어요.",
      askAiNotThis: "원하는 답이 아니면 AI에게 찾아 달라고 하기",
      askAi: "AI에게 찾아 달라고 하기",
      aiPrivacy: "AI에는 적은 질문만 보내요. 이름·연락처 같은 개인정보는 적지 마세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  helpPage: {
    title: "Help",
    subtitle: "Frequently asked questions and where to contact us.",
    contact: "Contact us",
    contactBody:
      "If you can't find an answer, email us. For an error, tell us which screen you were on and what you tapped and we can check quickly.",
    mailApp: "Email us from your mail app",
    gmail: "Write in Gmail",
    copyAddress: "Copy address",
    copied: "Copied",
    mailFallback:
      "If your mail app doesn't open, tap “Write in Gmail”, or copy the address and send from the mail you use.",
    privacyBefore: "Requests about personal information go to the same address (",
    privacyLink: "Privacy policy",
    privacyAfter: ").",
    noContact: "We haven't set up a contact channel yet.",
    mailSubject: "[SubSlash inquiry] ",
    mailBody: (app) => `Your question:\n\n\n---\nEnvironment: ${app ? "app" : "web"}`,
    search: {
      label: "Search help",
      placeholder: "What would you like to know?",
      unavailable: "Can't answer right now.",
      aiFound: "The AI found this in Help",
      aiNone: "The AI couldn't find it in Help either",
      aiEmpty: "That isn't covered in Help. Tell us through “Contact us” below.",
      closest: "Closest question",
      similar: "Questions that may be similar",
      noMatch: "Couldn't find a similar question.",
      askAiNotThis: "If that's not the answer, ask the AI to look for it",
      askAi: "Ask the AI to look for it",
      aiPrivacy:
        "Only the question you wrote goes to the AI. Don't include personal details such as your name or contacts.",
    },
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
export const zh: Widen<typeof ko> = {
  helpPage: {
    title: "帮助",
    subtitle: "常见问题和联系方式。",
    contact: "联系我们",
    contactBody:
      "如果找不到答案，请发邮件给我们。遇到错误时，告诉我们你在哪个页面、点了什么，我们能更快确认。",
    mailApp: "用邮件应用写信",
    gmail: "在 Gmail 中写信",
    copyAddress: "复制地址",
    copied: "已复制",
    mailFallback: "如果邮件应用没有打开，请点“在 Gmail 中写信”，或复制地址后用你常用的邮箱发送。",
    privacyBefore: "有关个人信息的请求也发到同一个地址（",
    privacyLink: "隐私政策",
    privacyAfter: "）。",
    noContact: "我们还没有设置联系渠道。",
    mailSubject: "[SubSlash 咨询] ",
    mailBody: (app) => `你的问题：\n\n\n---\n使用环境：${app ? "应用" : "网页"}`,
    search: {
      label: "搜索帮助",
      placeholder: "你想了解什么？",
      unavailable: "现在无法回答。",
      aiFound: "AI 在帮助中找到了这些",
      aiNone: "AI 也没能在帮助中找到",
      aiEmpty: "帮助中没有相关内容。请通过下方的“联系我们”告诉我们。",
      closest: "最相近的问题",
      similar: "可能相似的问题",
      noMatch: "没有找到相似的问题。",
      askAiNotThis: "如果不是这个答案，请让 AI 帮你找",
      askAi: "让 AI 帮你找",
      aiPrivacy: "只有你写的问题会发送给 AI。请不要写入姓名、联系方式等个人信息。",
    },
  },
};

export const ja: Widen<typeof ko> = {
  helpPage: {
    title: "ヘルプ",
    subtitle: "よくある質問とお問い合わせ先です。",
    contact: "お問い合わせ",
    contactBody:
      "答えが見つからなければメールでお知らせください。エラーの場合は、どの画面で何を押したかを書いていただくとすぐに確認できます。",
    mailApp: "メールアプリで書く",
    gmail: "Gmail で書く",
    copyAddress: "アドレスをコピー",
    copied: "コピーしました",
    mailFallback:
      "メールアプリが開かない場合は「Gmail で書く」を押すか、アドレスをコピーしていつも使うメールから送ってください。",
    privacyBefore: "個人情報に関するご依頼も同じアドレスへどうぞ（",
    privacyLink: "プライバシーポリシー",
    privacyAfter: "）。",
    noContact: "お問い合わせ先はまだ準備中です。",
    mailSubject: "[SubSlash お問い合わせ] ",
    mailBody: (app) => `ご質問:\n\n\n---\n利用環境: ${app ? "アプリ" : "ウェブ"}`,
    search: {
      label: "ヘルプを検索",
      placeholder: "何を知りたいですか？",
      unavailable: "今は答えられません。",
      aiFound: "AI がヘルプで見つけた項目",
      aiNone: "AI もヘルプで見つけられませんでした",
      aiEmpty: "ヘルプにない内容です。下の「お問い合わせ」からお知らせください。",
      closest: "いちばん近い質問",
      similar: "似ているかもしれない質問",
      noMatch: "似た質問が見つかりませんでした。",
      askAiNotThis: "これが答えでなければ AI に探してもらう",
      askAi: "AI に探してもらう",
      aiPrivacy:
        "AI には書いた質問だけが送られます。名前や連絡先などの個人情報は書かないでください。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  helpPage: {
    title: "Trợ giúp",
    subtitle: "Câu hỏi thường gặp và nơi liên hệ.",
    contact: "Liên hệ",
    contactBody:
      "Nếu không tìm thấy câu trả lời, hãy gửi email cho chúng tôi. Khi gặp lỗi, cho biết bạn đang ở màn hình nào và đã nhấn gì để chúng tôi kiểm tra nhanh.",
    mailApp: "Viết bằng ứng dụng email",
    gmail: "Viết trong Gmail",
    copyAddress: "Sao chép địa chỉ",
    copied: "Đã sao chép",
    mailFallback:
      "Nếu ứng dụng email không mở, hãy nhấn “Viết trong Gmail”, hoặc sao chép địa chỉ rồi gửi từ email bạn hay dùng.",
    privacyBefore: "Yêu cầu về thông tin cá nhân cũng gửi đến cùng địa chỉ (",
    privacyLink: "Chính sách quyền riêng tư",
    privacyAfter: ").",
    noContact: "Chúng tôi chưa thiết lập kênh liên hệ.",
    mailSubject: "[Hỏi đáp SubSlash] ",
    mailBody: (app) => `Câu hỏi của bạn:\n\n\n---\nMôi trường: ${app ? "ứng dụng" : "web"}`,
    search: {
      label: "Tìm trong trợ giúp",
      placeholder: "Bạn muốn biết điều gì?",
      unavailable: "Hiện không thể trả lời.",
      aiFound: "AI đã tìm thấy mục này trong Trợ giúp",
      aiNone: "AI cũng không tìm thấy trong Trợ giúp",
      aiEmpty: "Trợ giúp chưa có nội dung này. Hãy báo cho chúng tôi qua “Liên hệ” bên dưới.",
      closest: "Câu hỏi gần nhất",
      similar: "Câu hỏi có thể tương tự",
      noMatch: "Không tìm thấy câu hỏi tương tự.",
      askAiNotThis: "Nếu không phải câu trả lời này, hãy nhờ AI tìm",
      askAi: "Nhờ AI tìm",
      aiPrivacy:
        "Chỉ câu hỏi bạn viết được gửi đến AI. Đừng ghi thông tin cá nhân như tên hay số liên lạc.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  helpPage: {
    title: "Aide",
    subtitle: "Questions fréquentes et moyens de nous contacter.",
    contact: "Nous contacter",
    contactBody:
      "Si vous ne trouvez pas de réponse, écrivez-nous. Pour une erreur, indiquez l'écran et ce sur quoi vous avez appuyé : nous pourrons vérifier rapidement.",
    mailApp: "Écrire avec votre messagerie",
    gmail: "Écrire dans Gmail",
    copyAddress: "Copier l'adresse",
    copied: "Copié",
    mailFallback:
      "Si votre messagerie ne s'ouvre pas, appuyez sur « Écrire dans Gmail », ou copiez l'adresse et écrivez depuis votre messagerie habituelle.",
    privacyBefore: "Les demandes concernant vos données personnelles vont à la même adresse (",
    privacyLink: "Politique de confidentialité",
    privacyAfter: ").",
    noContact: "Nous n'avons pas encore mis en place de moyen de contact.",
    mailSubject: "[Question SubSlash] ",
    mailBody: (app) => `Votre question :\n\n\n---\nEnvironnement : ${app ? "application" : "web"}`,
    search: {
      label: "Rechercher dans l'aide",
      placeholder: "Que voulez-vous savoir ?",
      unavailable: "Impossible de répondre pour le moment.",
      aiFound: "L'IA a trouvé ceci dans l'aide",
      aiNone: "L'IA ne l'a pas trouvé non plus dans l'aide",
      aiEmpty: "Ce n'est pas couvert par l'aide. Dites-le-nous via « Nous contacter » ci-dessous.",
      closest: "Question la plus proche",
      similar: "Questions peut-être similaires",
      noMatch: "Aucune question similaire trouvée.",
      askAiNotThis: "Si ce n'est pas la réponse, demandez à l'IA de chercher",
      askAi: "Demander à l'IA de chercher",
      aiPrivacy:
        "Seule votre question est envoyée à l'IA. N'y mettez pas de données personnelles comme votre nom ou vos coordonnées.",
    },
  },
};

export const es: Widen<typeof ko> = {
  helpPage: {
    title: "Ayuda",
    subtitle: "Preguntas frecuentes y cómo contactarnos.",
    contact: "Contactar",
    contactBody:
      "Si no encuentras la respuesta, escríbenos. Si es un error, dinos en qué pantalla estabas y qué pulsaste para revisarlo rápido.",
    mailApp: "Escribir con tu app de correo",
    gmail: "Escribir en Gmail",
    copyAddress: "Copiar dirección",
    copied: "Copiado",
    mailFallback:
      "Si no se abre tu app de correo, pulsa «Escribir en Gmail» o copia la dirección y envía desde el correo que uses.",
    privacyBefore: "Las solicitudes sobre datos personales van a la misma dirección (",
    privacyLink: "Política de privacidad",
    privacyAfter: ").",
    noContact: "Aún no hemos configurado un canal de contacto.",
    mailSubject: "[Consulta SubSlash] ",
    mailBody: (app) => `Tu pregunta:\n\n\n---\nEntorno: ${app ? "app" : "web"}`,
    search: {
      label: "Buscar en la ayuda",
      placeholder: "¿Qué quieres saber?",
      unavailable: "No se puede responder ahora.",
      aiFound: "La IA encontró esto en la ayuda",
      aiNone: "La IA tampoco lo encontró en la ayuda",
      aiEmpty: "No está en la ayuda. Cuéntanoslo en «Contactar» abajo.",
      closest: "Pregunta más parecida",
      similar: "Preguntas que pueden ser parecidas",
      noMatch: "No se encontró ninguna pregunta parecida.",
      askAiNotThis: "Si no es la respuesta, pide a la IA que la busque",
      askAi: "Pedir a la IA que lo busque",
      aiPrivacy:
        "Solo tu pregunta se envía a la IA. No incluyas datos personales como tu nombre o contacto.",
    },
  },
};

export const de: Widen<typeof ko> = {
  helpPage: {
    title: "Hilfe",
    subtitle: "Häufige Fragen und wie du uns erreichst.",
    contact: "Kontakt",
    contactBody:
      "Wenn du keine Antwort findest, schreib uns eine E-Mail. Bei einem Fehler sag uns, auf welchem Bildschirm du warst und worauf du getippt hast, dann können wir es schnell prüfen.",
    mailApp: "Mit deiner Mail-App schreiben",
    gmail: "In Gmail schreiben",
    copyAddress: "Adresse kopieren",
    copied: "Kopiert",
    mailFallback:
      "Wenn sich deine Mail-App nicht öffnet, tippe auf „In Gmail schreiben“ oder kopiere die Adresse und schreib aus deinem üblichen Postfach.",
    privacyBefore: "Anfragen zu personenbezogenen Daten gehen an dieselbe Adresse (",
    privacyLink: "Datenschutzerklärung",
    privacyAfter: ").",
    noContact: "Wir haben noch keinen Kontaktweg eingerichtet.",
    mailSubject: "[SubSlash-Anfrage] ",
    mailBody: (app) => `Deine Frage:\n\n\n---\nUmgebung: ${app ? "App" : "Web"}`,
    search: {
      label: "Hilfe durchsuchen",
      placeholder: "Was möchtest du wissen?",
      unavailable: "Gerade keine Antwort möglich.",
      aiFound: "Das hat die KI in der Hilfe gefunden",
      aiNone: "Auch die KI hat es in der Hilfe nicht gefunden",
      aiEmpty: "Das steht nicht in der Hilfe. Sag es uns unten über „Kontakt“.",
      closest: "Ähnlichste Frage",
      similar: "Möglicherweise ähnliche Fragen",
      noMatch: "Keine ähnliche Frage gefunden.",
      askAiNotThis: "Wenn das nicht die Antwort ist, lass die KI suchen",
      askAi: "Die KI suchen lassen",
      aiPrivacy:
        "Nur deine Frage geht an die KI. Schreib keine persönlichen Daten wie Namen oder Kontaktdaten hinein.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  helpPage: {
    title: "Ajuda",
    subtitle: "Perguntas frequentes e como falar com a gente.",
    contact: "Fale conosco",
    contactBody:
      "Se não encontrar a resposta, mande um e-mail. Em caso de erro, diga em qual tela você estava e no que tocou, para conferirmos rápido.",
    mailApp: "Escrever no app de e-mail",
    gmail: "Escrever no Gmail",
    copyAddress: "Copiar endereço",
    copied: "Copiado",
    mailFallback:
      "Se o app de e-mail não abrir, toque em “Escrever no Gmail” ou copie o endereço e envie do e-mail que você usa.",
    privacyBefore: "Pedidos sobre dados pessoais vão para o mesmo endereço (",
    privacyLink: "Política de privacidade",
    privacyAfter: ").",
    noContact: "Ainda não configuramos um canal de contato.",
    mailSubject: "[Dúvida SubSlash] ",
    mailBody: (app) => `Sua pergunta:\n\n\n---\nAmbiente: ${app ? "app" : "web"}`,
    search: {
      label: "Buscar na ajuda",
      placeholder: "O que você quer saber?",
      unavailable: "Não é possível responder agora.",
      aiFound: "A IA encontrou isto na ajuda",
      aiNone: "A IA também não encontrou na ajuda",
      aiEmpty: "Isso não está na ajuda. Conte para a gente em “Fale conosco” abaixo.",
      closest: "Pergunta mais parecida",
      similar: "Perguntas que podem ser parecidas",
      noMatch: "Nenhuma pergunta parecida encontrada.",
      askAiNotThis: "Se não for a resposta, peça para a IA procurar",
      askAi: "Pedir para a IA procurar",
      aiPrivacy: "Só a sua pergunta vai para a IA. Não inclua dados pessoais como nome ou contato.",
    },
  },
};
