import { withJosa } from "../josa";
import type { Widen } from "../types";
import { monthLong, pluralOf } from "../english";
import { monthName } from "../months";

/**
 * 구독 리포트(/report). 영수증 화면과 '리포트에 물어보기'의 답은 서버·기록에서 문장을 만드는 별도 영역이라
 * 여기에 없다.
 */
export const ko = {
  reportPage: {
    title: "구독 리포트",
    subtitle: "지금 내는 돈과, 제값을 하는지 한눈에.",
    emptyTitle: "아직 등록한 구독이 없어요",
    emptyHint: "구독을 등록하면 여기서 정리해 드려요.",
    register: "구독 등록하러 가기",
    receipts: {
      label: "구독 영수증",
      month: (month: number) => `${month}월 영수증`,
      year: (year: number) => `${year}년 결산 영수증`,
    },
    summary: {
      label: "지출 요약",
      month: "한 달",
      year: "1년이면",
      subs: "구독",
      count: (count: number) => `${count}개`,
    },
    overlap: {
      label: "결합 상품과 겹치는 구독",
      title: "두 번 내고 있을 수 있어요",
      middle: (services: string) => `에 ${withJosa(services, "이", "가")} 들어 있는데 `,
      after: "도 따로 구독 중이에요. 다른 계정으로 쓰는 게 아니라면 한 쪽을 해지해도 돼요.",
    },
    ranking: {
      title: "1회 단가 순위",
      monthly: (amount: string) => `한 달 ${amount}`,
      used: (count: number) => ` · ${count}번 사용`,
      beforeCheckIn: "체크인 전",
      unused: "안 썼어요",
      perUse: "1회",
      note: "‘체크인 전’인 구독은 대시보드에서 이번 달 사용 횟수를 알려 주면 1회 단가가 나와요.",
    },
    other: {
      title: "횟수 말고 다른 기준으로 재는 구독",
      note: "음악은 들은 시간, AI·업무 도구는 쓴 날, 멤버십은 받은 혜택, 저장 공간은 쓰는 용량으로 봐요.",
    },
    ask: {
      label: "리포트에 물어보기",
      title: "리포트에 물어보기",
      unavailable: "지금은 답할 수 없어요.",
      goHelp: "도움말에서 찾아보기",
      source: (source: string) => `계산: ${source} · 숫자는 이 기기에서 계산했어요`,
      placeholder: "직접 물어보기",
      inputLabel: "리포트에 물어볼 질문",
      send: "묻기",
      newChat: "새로 묻기",
      followupPlaceholder: "이어서 물어보기 (예: 그럼 1년이면?)",
      contextNote:
        "이어서 물으면 같은 대화의 앞선 질문 3개까지 함께 보내 꼬리 질문을 알아들어요. 답과 숫자는 보내지 않아요.",
      youAsked: "물어본 질문",
      privacy:
        "질문 문장만 AI로 보내요. 내 구독 목록과 금액은 보내지 않아요. 이름·연락처 같은 개인정보는 적지 마세요.",
      privacyLocal: "질문은 이 기기에서만 알아듣고 계산해요. 서버나 AI로 보내지 않아요.",
      localMiss:
        "이 질문은 아직 알아듣지 못해요. 아래 질문 버튼을 눌러 보거나, '한 달 구독료 얼마야?'처럼 물어봐 주세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  reportPage: {
    title: "Subscription report",
    subtitle: "What you pay now, and whether it's worth it, at a glance.",
    emptyTitle: "No subscriptions yet",
    emptyHint: "Add a subscription and we'll sum it up here.",
    register: "Add a subscription",
    receipts: {
      label: "Subscription receipts",
      month: (month) => `${monthLong(month)} receipt`,
      year: (year) => `${year} year-end receipt`,
    },
    summary: {
      label: "Spending summary",
      month: "A month",
      year: "In a year",
      subs: "Subscriptions",
      count: (count) => String(count),
    },
    overlap: {
      label: "Subscriptions that overlap with a bundle",
      title: "You may be paying twice",
      middle: (services) => ` includes ${services}, but you also subscribe to `,
      after: " separately. Unless it's a different account, you can cancel one of them.",
    },
    ranking: {
      title: "Cost per use ranking",
      monthly: (amount) => `${amount} a month`,
      used: (count) => ` · used ${count} ${pluralOf(count, "time", "times")}`,
      beforeCheckIn: "No check-in yet",
      unused: "Not used",
      perUse: "per use",
      note: "For subscriptions with “No check-in yet”, tell us this month's usage on the dashboard and the cost per use appears.",
    },
    other: {
      title: "Subscriptions measured another way",
      note: "Music is measured by hours listened, AI and work tools by days used, memberships by benefits received, and storage by space used.",
    },
    ask: {
      label: "Ask your report",
      title: "Ask your report",
      unavailable: "Can't answer right now.",
      goHelp: "Look it up in Help",
      source: (source) => `Calculated from: ${source} · the numbers were worked out on this device`,
      placeholder: "Ask your own question",
      inputLabel: "Question about your report",
      send: "Ask",
      newChat: "New question",
      followupPlaceholder: "Ask a follow-up (e.g. what about a year?)",
      contextNote:
        "Follow-ups send up to 3 earlier questions from this chat so the AI understands them. Answers and numbers aren't sent.",
      youAsked: "You asked",
      privacy:
        "Only the question text goes to the AI. Your subscription list and amounts aren't sent. Don't include personal details such as your name or contacts.",
      privacyLocal:
        "Questions are understood and calculated on this device only. Nothing is sent to a server or an AI.",
      localMiss: "I can't understand this question yet. Try one of the question buttons below.",
    },
  },
};

const rpPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  reportPage: {
    title: "订阅报告",
    subtitle: "现在付了多少、值不值，一目了然。",
    emptyTitle: "还没有订阅",
    emptyHint: "添加订阅后，这里会为你汇总。",
    register: "添加订阅",
    receipts: {
      label: "订阅小票",
      month: (month) => `${Number(month)}月小票`,
      year: (year) => `${year}年度小票`,
    },
    summary: {
      label: "支出摘要",
      month: "每月",
      year: "每年",
      subs: "订阅",
      count: (count) => `${count} 个`,
    },
    overlap: {
      label: "与组合套餐重复的订阅",
      title: "你可能付了两次钱",
      middle: (services) => ` 包含 ${services}，但你还另外订阅了 `,
      after: "。除非是不同的账户，否则可以退订其中一个。",
    },
    ranking: {
      title: "单次成本排行",
      monthly: (amount) => `每月 ${amount}`,
      used: (count) => ` · 使用 ${count} 次`,
      beforeCheckIn: "尚未签到",
      unused: "没用过",
      perUse: "每次",
      note: "对于“尚未签到”的订阅，在仪表板上告诉我们本月的使用情况，就会显示单次成本。",
    },
    other: {
      title: "用其他方式衡量的订阅",
      note: "音乐按收听时长，AI 和工作工具按使用天数，会员按获得的优惠，存储按已用空间衡量。",
    },
    ask: {
      label: "询问报告",
      title: "询问报告",
      unavailable: "现在无法回答。",
      goHelp: "在帮助中查找",
      source: (source) => `计算依据：${source} · 数字在这台设备上计算`,
      placeholder: "输入你的问题",
      inputLabel: "关于报告的问题",
      send: "提问",
      newChat: "重新提问",
      followupPlaceholder: "继续提问（例如：那一年呢？）",
      contextNote:
        "继续提问时，会一并发送本次对话中最多 3 个之前的问题，以便理解追问。不会发送回答和数字。",
      youAsked: "你的问题",
      privacy:
        "只有问题文字会发送给 AI，订阅列表和金额不会发送。请不要写入姓名、联系方式等个人信息。",
      privacyLocal: "问题只在本设备上理解和计算，不会发送到服务器或 AI。",
      localMiss: "暂时还无法理解这个问题。请试试下面的问题按钮。",
    },
  },
};

export const ja: Widen<typeof ko> = {
  reportPage: {
    title: "サブスクレポート",
    subtitle: "今払っている額と、元が取れているかをひと目で。",
    emptyTitle: "まだサブスクがありません",
    emptyHint: "サブスクを登録すると、ここにまとめて表示します。",
    register: "サブスクを登録",
    receipts: {
      label: "サブスクのレシート",
      month: (month) => `${Number(month)}月のレシート`,
      year: (year) => `${year}年の年間レシート`,
    },
    summary: {
      label: "支出のまとめ",
      month: "1 か月",
      year: "1 年",
      subs: "サブスク",
      count: (count) => `${count} 件`,
    },
    overlap: {
      label: "セット商品と重なるサブスク",
      title: "二重に払っているかもしれません",
      middle: (services) => ` には ${services} が含まれていますが、別に `,
      after: " も契約しています。別のアカウントでなければ、どちらかを解約できます。",
    },
    ranking: {
      title: "1 回あたりの単価ランキング",
      monthly: (amount) => `月 ${amount}`,
      used: (count) => ` · ${count} 回利用`,
      beforeCheckIn: "まだチェックインしていません",
      unused: "未使用",
      perUse: "1 回あたり",
      note: "「まだチェックインしていません」のサブスクは、ダッシュボードで今月の利用を教えてくれると単価が表示されます。",
    },
    other: {
      title: "別の方法で測るサブスク",
      note: "音楽は聞いた時間、AI や仕事のツールは使った日数、メンバーシップは受けた特典、ストレージは使った容量で測ります。",
    },
    ask: {
      label: "レポートに質問",
      title: "レポートに質問",
      unavailable: "今は答えられません。",
      goHelp: "ヘルプで探す",
      source: (source) => `計算の根拠: ${source} · 数字はこの端末で計算しました`,
      placeholder: "自由に質問する",
      inputLabel: "レポートについての質問",
      send: "質問",
      newChat: "新しく聞く",
      followupPlaceholder: "続けて聞く（例：じゃあ1年だと？）",
      contextNote:
        "続けて聞くと、この会話の前の質問を最大 3 件いっしょに送り、続きの質問を理解します。答えと数字は送りません。",
      youAsked: "聞いた質問",
      privacy:
        "AI には質問の文章だけが送られ、サブスクの一覧や金額は送られません。名前や連絡先などの個人情報は書かないでください。",
      privacyLocal: "質問はこの端末の中だけで理解・計算します。サーバーや AI には送りません。",
      localMiss: "この質問はまだ理解できません。下の質問ボタンを押してみてください。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  reportPage: {
    title: "Báo cáo gói đăng ký",
    subtitle: "Bạn đang trả bao nhiêu và có đáng không, xem ngay trong nháy mắt.",
    emptyTitle: "Chưa có gói đăng ký nào",
    emptyHint: "Thêm gói đăng ký, chúng tôi sẽ tổng hợp ở đây.",
    register: "Thêm gói đăng ký",
    receipts: {
      label: "Hóa đơn gói đăng ký",
      month: (month) => `Hóa đơn tháng ${Number(month)}`,
      year: (year) => `Hóa đơn tổng kết năm ${year}`,
    },
    summary: {
      label: "Tóm tắt chi tiêu",
      month: "Mỗi tháng",
      year: "Mỗi năm",
      subs: "Gói đăng ký",
      count: (count) => String(count),
    },
    overlap: {
      label: "Gói trùng với gói kết hợp",
      title: "Có thể bạn đang trả hai lần",
      middle: (services) => ` đã gồm ${services}, nhưng bạn còn đăng ký riêng `,
      after: ". Nếu không phải tài khoản khác, bạn có thể hủy một trong hai.",
    },
    ranking: {
      title: "Xếp hạng chi phí mỗi lần dùng",
      monthly: (amount) => `${amount} mỗi tháng`,
      used: (count) => ` · dùng ${count} lần`,
      beforeCheckIn: "Chưa check-in",
      unused: "Chưa dùng",
      perUse: "mỗi lần",
      note: "Với gói “Chưa check-in”, hãy cho biết mức dùng tháng này trên bảng điều khiển để thấy chi phí mỗi lần dùng.",
    },
    other: {
      title: "Gói được đo theo cách khác",
      note: "Nhạc đo theo giờ nghe, AI và công cụ làm việc theo số ngày dùng, gói thành viên theo ưu đãi nhận được, lưu trữ theo dung lượng đã dùng.",
    },
    ask: {
      label: "Hỏi báo cáo",
      title: "Hỏi báo cáo",
      unavailable: "Hiện không thể trả lời.",
      goHelp: "Tìm trong Trợ giúp",
      source: (source) => `Tính từ: ${source} · các con số được tính trên thiết bị này`,
      placeholder: "Đặt câu hỏi của bạn",
      inputLabel: "Câu hỏi về báo cáo",
      send: "Hỏi",
      newChat: "Hỏi mới",
      followupPlaceholder: "Hỏi tiếp (ví dụ: còn một năm thì sao?)",
      contextNote:
        "Khi hỏi tiếp, tối đa 3 câu hỏi trước trong cuộc trò chuyện này được gửi kèm để AI hiểu câu hỏi nối tiếp. Câu trả lời và con số không được gửi.",
      youAsked: "Bạn đã hỏi",
      privacy:
        "Chỉ nội dung câu hỏi được gửi đến AI. Danh sách và số tiền đăng ký không được gửi. Đừng ghi thông tin cá nhân như tên hay số liên lạc.",
      privacyLocal:
        "Câu hỏi chỉ được hiểu và tính trên thiết bị này. Không gửi đến máy chủ hay AI.",
      localMiss: "Chưa hiểu được câu hỏi này. Hãy thử các nút câu hỏi bên dưới.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  reportPage: {
    title: "Rapport d'abonnements",
    subtitle: "Ce que vous payez et si cela en vaut la peine, d'un coup d'œil.",
    emptyTitle: "Pas encore d'abonnement",
    emptyHint: "Ajoutez un abonnement et nous le résumerons ici.",
    register: "Ajouter un abonnement",
    receipts: {
      label: "Tickets d'abonnements",
      month: (month) => `Ticket de ${monthName("fr", month)}`,
      year: (year) => `Bilan ${year}`,
    },
    summary: {
      label: "Résumé des dépenses",
      month: "Par mois",
      year: "Par an",
      subs: "Abonnements",
      count: (count) => String(count),
    },
    overlap: {
      label: "Abonnements en double avec une offre groupée",
      title: "Vous payez peut-être deux fois",
      middle: (services) => ` inclut ${services}, mais vous êtes aussi abonné séparément à `,
      after: ". Sauf s'il s'agit d'un autre compte, vous pouvez en résilier un.",
    },
    ranking: {
      title: "Classement du coût par utilisation",
      monthly: (amount) => `${amount} par mois`,
      used: (count) => ` · utilisé ${count} fois`,
      beforeCheckIn: "Pas encore de check-in",
      unused: "Pas utilisé",
      perUse: "par utilisation",
      note: "Pour les abonnements « Pas encore de check-in », indiquez l'utilisation du mois sur le tableau de bord et le coût par utilisation apparaîtra.",
    },
    other: {
      title: "Abonnements mesurés autrement",
      note: "La musique se mesure en heures d'écoute, l'IA et les outils de travail en jours d'utilisation, les adhésions en avantages reçus et le stockage en espace utilisé.",
    },
    ask: {
      label: "Interroger votre rapport",
      title: "Interroger votre rapport",
      unavailable: "Impossible de répondre pour le moment.",
      goHelp: "Chercher dans l'aide",
      source: (source) =>
        `Calculé à partir de : ${source} · les chiffres ont été calculés sur cet appareil`,
      placeholder: "Posez votre question",
      inputLabel: "Question sur votre rapport",
      send: "Demander",
      newChat: "Nouvelle question",
      followupPlaceholder: "Poser une question de suite (ex. : et sur un an ?)",
      contextNote:
        "Pour une question de suite, jusqu'à 3 questions précédentes de cette conversation sont envoyées pour que l'IA comprenne. Les réponses et les chiffres ne sont pas envoyés.",
      youAsked: "Votre question",
      privacy:
        "Seul le texte de la question est envoyé à l'IA. Votre liste d'abonnements et vos montants ne le sont pas. N'y mettez pas de données personnelles comme votre nom ou vos coordonnées.",
      privacyLocal:
        "Les questions sont comprises et calculées uniquement sur cet appareil. Rien n'est envoyé à un serveur ni à une IA.",
      localMiss:
        "Je ne comprends pas encore cette question. Essayez l'un des boutons de questions ci-dessous.",
    },
  },
};

export const es: Widen<typeof ko> = {
  reportPage: {
    title: "Informe de suscripciones",
    subtitle: "Lo que pagas ahora y si vale la pena, de un vistazo.",
    emptyTitle: "Todavía no hay suscripciones",
    emptyHint: "Añade una suscripción y la resumiremos aquí.",
    register: "Añadir suscripción",
    receipts: {
      label: "Tickets de suscripciones",
      month: (month) => `Ticket de ${monthName("es", month)}`,
      year: (year) => `Resumen de ${year}`,
    },
    summary: {
      label: "Resumen de gastos",
      month: "Al mes",
      year: "Al año",
      subs: "Suscripciones",
      count: (count) => String(count),
    },
    overlap: {
      label: "Suscripciones que coinciden con un paquete",
      title: "Puede que estés pagando dos veces",
      middle: (services) => ` incluye ${services}, pero también estás suscrito por separado a `,
      after: ". Salvo que sea otra cuenta, puedes cancelar una de las dos.",
    },
    ranking: {
      title: "Ranking de coste por uso",
      monthly: (amount) => `${amount} al mes`,
      used: (count) => ` · usado ${count} ${rpPl(count, "vez", "veces")}`,
      beforeCheckIn: "Sin registro todavía",
      unused: "Sin usar",
      perUse: "por uso",
      note: "Para las suscripciones «Sin registro todavía», cuéntanos el uso de este mes en el panel y aparecerá el coste por uso.",
    },
    other: {
      title: "Suscripciones medidas de otra forma",
      note: "La música se mide por horas escuchadas, la IA y las herramientas de trabajo por días de uso, las membresías por ventajas recibidas y el almacenamiento por espacio usado.",
    },
    ask: {
      label: "Pregunta a tu informe",
      title: "Pregunta a tu informe",
      unavailable: "No se puede responder ahora.",
      goHelp: "Buscar en la ayuda",
      source: (source) => `Calculado con: ${source} · las cifras se calcularon en este dispositivo`,
      placeholder: "Escribe tu pregunta",
      inputLabel: "Pregunta sobre tu informe",
      send: "Preguntar",
      newChat: "Nueva pregunta",
      followupPlaceholder: "Seguir preguntando (p. ej.: ¿y en un año?)",
      contextNote:
        "Al seguir preguntando se envían hasta 3 preguntas anteriores de esta conversación para que la IA entienda. No se envían respuestas ni cifras.",
      youAsked: "Preguntaste",
      privacy:
        "Solo el texto de la pregunta va a la IA. Tu lista de suscripciones y los importes no se envían. No incluyas datos personales como tu nombre o contacto.",
      privacyLocal:
        "Las preguntas se entienden y calculan solo en este dispositivo. No se envía nada a un servidor ni a una IA.",
      localMiss:
        "Todavía no entiendo esta pregunta. Prueba uno de los botones de preguntas de abajo.",
    },
  },
};

export const de: Widen<typeof ko> = {
  reportPage: {
    title: "Abo-Bericht",
    subtitle: "Was du jetzt zahlst und ob es sich lohnt, auf einen Blick.",
    emptyTitle: "Noch keine Abos",
    emptyHint: "Füg ein Abo hinzu, dann fassen wir es hier zusammen.",
    register: "Abo hinzufügen",
    receipts: {
      label: "Abo-Belege",
      month: (month) => `Beleg für ${monthName("de", month)}`,
      year: (year) => `Jahresbeleg ${year}`,
    },
    summary: {
      label: "Ausgabenübersicht",
      month: "Pro Monat",
      year: "Pro Jahr",
      subs: "Abos",
      count: (count) => String(count),
    },
    overlap: {
      label: "Abos, die sich mit einem Paket überschneiden",
      title: "Du zahlst vielleicht doppelt",
      middle: (services) => ` enthält ${services}, aber du hast zusätzlich separat `,
      after: " abonniert. Wenn es nicht ein anderes Konto ist, kannst du eines davon kündigen.",
    },
    ranking: {
      title: "Ranking der Kosten pro Nutzung",
      monthly: (amount) => `${amount} im Monat`,
      used: (count) => ` · ${count}-mal genutzt`,
      beforeCheckIn: "Noch kein Eintrag",
      unused: "Nicht genutzt",
      perUse: "pro Nutzung",
      note: "Bei Abos mit „Noch kein Eintrag“ trag in der Übersicht die Nutzung dieses Monats ein, dann erscheinen die Kosten pro Nutzung.",
    },
    other: {
      title: "Anders gemessene Abos",
      note: "Musik wird nach Hörstunden gemessen, KI und Arbeitstools nach Nutzungstagen, Mitgliedschaften nach erhaltenen Vorteilen und Speicher nach belegtem Platz.",
    },
    ask: {
      label: "Deinen Bericht fragen",
      title: "Deinen Bericht fragen",
      unavailable: "Gerade keine Antwort möglich.",
      goHelp: "In der Hilfe nachsehen",
      source: (source) => `Berechnet aus: ${source} · die Zahlen wurden auf diesem Gerät berechnet`,
      placeholder: "Stell deine eigene Frage",
      inputLabel: "Frage zu deinem Bericht",
      send: "Fragen",
      newChat: "Neue Frage",
      followupPlaceholder: "Nachfragen (z. B. und für ein Jahr?)",
      contextNote:
        "Bei Nachfragen werden bis zu 3 frühere Fragen aus diesem Chat mitgeschickt, damit die KI sie versteht. Antworten und Zahlen werden nicht gesendet.",
      youAsked: "Deine Frage",
      privacy:
        "Nur der Fragetext geht an die KI. Deine Abo-Liste und Beträge werden nicht gesendet. Schreib keine persönlichen Daten wie Namen oder Kontaktdaten hinein.",
      privacyLocal:
        "Fragen werden nur auf diesem Gerät verstanden und berechnet. Nichts wird an einen Server oder eine KI gesendet.",
      localMiss:
        "Diese Frage verstehe ich noch nicht. Probiere einen der Fragen-Buttons unten aus.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  reportPage: {
    title: "Relatório de assinaturas",
    subtitle: "Quanto você paga agora e se vale a pena, num relance.",
    emptyTitle: "Ainda não há assinaturas",
    emptyHint: "Adicione uma assinatura e vamos resumir aqui.",
    register: "Adicionar assinatura",
    receipts: {
      label: "Recibos de assinaturas",
      month: (month) => `Recibo de ${monthName("pt", month)}`,
      year: (year) => `Resumo de ${year}`,
    },
    summary: {
      label: "Resumo de gastos",
      month: "Por mês",
      year: "Por ano",
      subs: "Assinaturas",
      count: (count) => String(count),
    },
    overlap: {
      label: "Assinaturas que se sobrepõem a um pacote",
      title: "Você pode estar pagando duas vezes",
      middle: (services) => ` inclui ${services}, mas você também assina separadamente `,
      after: ". A menos que seja outra conta, dá para cancelar uma delas.",
    },
    ranking: {
      title: "Ranking de custo por uso",
      monthly: (amount) => `${amount} por mês`,
      used: (count) => ` · usado ${count} ${rpPl(count, "vez", "vezes")}`,
      beforeCheckIn: "Ainda sem registro",
      unused: "Sem uso",
      perUse: "por uso",
      note: "Para assinaturas “Ainda sem registro”, informe o uso deste mês no painel e o custo por uso aparece.",
    },
    other: {
      title: "Assinaturas medidas de outro jeito",
      note: "Música é medida por horas ouvidas, IA e ferramentas de trabalho por dias de uso, planos de membro por benefícios recebidos e armazenamento por espaço usado.",
    },
    ask: {
      label: "Pergunte ao seu relatório",
      title: "Pergunte ao seu relatório",
      unavailable: "Não é possível responder agora.",
      goHelp: "Procurar na ajuda",
      source: (source) =>
        `Calculado com: ${source} · os números foram calculados neste dispositivo`,
      placeholder: "Faça sua pergunta",
      inputLabel: "Pergunta sobre seu relatório",
      send: "Perguntar",
      newChat: "Nova pergunta",
      followupPlaceholder: "Continuar perguntando (ex.: e em um ano?)",
      contextNote:
        "Ao continuar, até 3 perguntas anteriores desta conversa vão junto para a IA entender. Respostas e números não são enviados.",
      youAsked: "Você perguntou",
      privacy:
        "Só o texto da pergunta vai para a IA. Sua lista de assinaturas e os valores não são enviados. Não inclua dados pessoais como nome ou contato.",
      privacyLocal:
        "As perguntas são entendidas e calculadas só neste dispositivo. Nada é enviado a um servidor nem a uma IA.",
      localMiss: "Ainda não entendo esta pergunta. Experimente um dos botões de perguntas abaixo.",
    },
  },
};
