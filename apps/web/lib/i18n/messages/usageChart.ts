import type { Widen } from "../types";

/** 리포트의 '구독별 사용 시간' 막대그래프(`UsageTimeChart`, 안드로이드 앱의 폰 사용 기록). */
export const ko = {
  usageChart: {
    title: "구독별 사용 시간",
    modeLabel: "기간",
    recent: "최근 30일",
    monthly: "월별",
    pending: "평가 전",
    legend:
      "막대 색은 가성비예요(체크인과 같은 기준). 기록이 30일 모이기 전에는 최근 체크인의 색을 쓰고, 체크인도 없으면 회색으로 둬요. 그 전이라도 '잘 씀' 기준을 채우면 그때부터 초록이에요.",
    partialMonth: "이 달은 기록이 있는 날만 셌어요.",
    excluded: (n: number) => `이 폰에 앱이 없거나 기록이 없는 구독 ${n}개는 빠져 있어요.`,
    noBars: "이 기간에 이 폰에서 잰 사용 기록이 없어요.",
    more: "자세히 보기",
    /** 웹의 사용량 그래프(체크인 기준, `CheckInUsageChart`). */
    checkIn: {
      title: "구독별 사용량",
      basis: "체크인 기준",
      legend:
        "막대가 꽉 차면 '잘 씀' 기준(한 달에 OTT 4회 · AI 10일 · 음악 10시간)에 닿은 거예요. 색은 체크인의 가성비예요.",
      pending: (n: number) => `체크인 전인 구독 ${n}개는 빠져 있어요.`,
      other: (n: number) => `혜택·용량으로 재는 구독 ${n}개는 아래 칸에서 봐요.`,
      empty:
        "아직 체크인한 구독이 없어요. 대시보드에서 최근 30일 사용량을 알려 주면 막대가 생겨요.",
      appHint: "안드로이드 앱에서는 폰 사용 기록으로 사용 시간을 그려요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  usageChart: {
    title: "Usage time by subscription",
    modeLabel: "Period",
    recent: "Last 30 days",
    monthly: "By month",
    pending: "Not rated yet",
    legend:
      "Bar colors show value for money (same rule as check-ins). Until 30 days of records are in, a bar takes the color of your latest check-in, or stays gray without one. It turns green as soon as it reaches the 'good value' mark.",
    partialMonth: "This month counts only the days with records.",
    excluded: (n) =>
      `${n} ${n === 1 ? "subscription isn't" : "subscriptions aren't"} shown because the app isn't on this phone or there are no records.`,
    noBars: "No usage was measured on this phone in this period.",
    more: "See details",
    checkIn: {
      title: "Usage by subscription",
      basis: "From check-ins",
      legend:
        "A full bar means it reached the 'good value' mark (4 uses of a streaming service, 10 days of AI or 10 hours of music a month). The color is the check-in's value rating.",
      pending: (n) =>
        n === 1
          ? "1 subscription without a check-in is left out."
          : `${n} subscriptions without a check-in are left out.`,
      other: (n) =>
        n === 1
          ? "1 subscription measured by benefits or storage is shown below."
          : `${n} subscriptions measured by benefits or storage are shown below.`,
      empty:
        "No check-ins yet. Tell the dashboard how much you used a subscription in the last 30 days and a bar appears here.",
      appHint: "In the Android app, bars show usage time from your phone's records.",
    },
  },
};

export const zh: Widen<typeof ko> = {
  usageChart: {
    title: "各订阅使用时间",
    modeLabel: "期间",
    recent: "最近 30 天",
    monthly: "按月",
    pending: "尚未评价",
    legend:
      "柱子颜色表示性价比（与签到相同的标准）。记录未满 30 天时使用最近一次签到的颜色，没有签到则为灰色。达到“值回票价”标准后即显示为绿色。",
    partialMonth: "本月只计算有记录的日子。",
    excluded: (n) => `有 ${n} 个订阅因本手机未安装应用或没有记录而未显示。`,
    noBars: "这段时间本手机没有测到使用记录。",
    more: "查看详情",
    checkIn: {
      title: "各订阅的使用量",
      basis: "按签到",
      legend:
        "柱子满格表示达到“值回票价”标准(每月视频 4 次 · AI 10 天 · 音乐 10 小时)。颜色是签到时的性价比。",
      pending: (n) => `${n} 个尚未签到的订阅未显示。`,
      other: (n) => `${n} 个按权益或存储空间衡量的订阅请见下方。`,
      empty: "还没有签到的订阅。在仪表盘填写最近 30 天的使用量后，这里会出现柱子。",
      appHint: "在安卓应用中，柱子显示手机记录的使用时间。",
    },
  },
};

export const ja: Widen<typeof ko> = {
  usageChart: {
    title: "サブスク別の利用時間",
    modeLabel: "期間",
    recent: "直近30日",
    monthly: "月別",
    pending: "評価前",
    legend:
      "棒の色はコスパです（チェックインと同じ基準）。30日分の記録がそろうまでは最新のチェックインの色を使い、チェックインもなければグレーです。それまでに「元が取れている」基準に届けば、その時点で緑になります。",
    partialMonth: "この月は記録がある日だけを数えています。",
    excluded: (n) => `この端末にアプリがないか記録がないサブスク ${n} 件は表示していません。`,
    noBars: "この期間、この端末で計測した利用記録はありません。",
    more: "詳しく見る",
    checkIn: {
      title: "サブスク別の利用量",
      basis: "チェックイン基準",
      legend:
        "バーがいっぱいなら「元が取れている」基準(月に動画 4 回 · AI 10 日 · 音楽 10 時間)に届いています。色はチェックインのコスパです。",
      pending: (n) => `チェックイン前のサブスク ${n} 件は表示していません。`,
      other: (n) => `特典・容量で測るサブスク ${n} 件は下の欄で見られます。`,
      empty:
        "まだチェックインしたサブスクがありません。ダッシュボードで最近 30 日の利用量を入力するとバーが表示されます。",
      appHint: "Android アプリでは、スマホの記録から利用時間を表示します。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  usageChart: {
    title: "Thời gian dùng theo gói",
    modeLabel: "Khoảng thời gian",
    recent: "30 ngày qua",
    monthly: "Theo tháng",
    pending: "Chưa đánh giá",
    legend:
      "Màu cột thể hiện độ đáng tiền (cùng tiêu chí với check-in). Khi chưa đủ 30 ngày dữ liệu, cột lấy màu của lần check-in gần nhất, nếu chưa check-in thì để màu xám. Đạt mức 'đáng tiền' sớm thì cột chuyển xanh ngay.",
    partialMonth: "Tháng này chỉ tính những ngày có dữ liệu.",
    excluded: (n) =>
      `${n} gói không hiển thị vì điện thoại này không có ứng dụng hoặc chưa có dữ liệu.`,
    noBars: "Không đo được thời gian dùng trên điện thoại này trong khoảng thời gian này.",
    more: "Xem chi tiết",
    checkIn: {
      title: "Mức dùng theo gói",
      basis: "Theo check-in",
      legend:
        "Cột đầy nghĩa là đã đạt mức 'đáng tiền' (mỗi tháng 4 lần xem phim · 10 ngày dùng AI · 10 giờ nghe nhạc). Màu là đánh giá giá trị của lần check-in.",
      pending: (n) => `${n} gói chưa check-in không được hiển thị.`,
      other: (n) => `${n} gói tính theo ưu đãi hoặc dung lượng xem ở mục bên dưới.`,
      empty:
        "Chưa có gói nào được check-in. Nhập mức dùng 30 ngày gần nhất ở bảng điều khiển để cột hiện ra ở đây.",
      appHint: "Trên ứng dụng Android, cột hiển thị thời gian dùng từ dữ liệu điện thoại.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  usageChart: {
    title: "Temps d'utilisation par abonnement",
    modeLabel: "Période",
    recent: "30 derniers jours",
    monthly: "Par mois",
    pending: "Pas encore évalué",
    legend:
      "La couleur des barres indique le rapport qualité-prix (même règle que les check-ins). Tant que 30 jours de données ne sont pas réunis, une barre prend la couleur du dernier check-in, ou reste grise sans check-in. Elle passe au vert dès que le seuil « rentable » est atteint.",
    partialMonth: "Ce mois ne compte que les jours avec des données.",
    excluded: (n) =>
      `${n} abonnement${n === 1 ? " n'est pas affiché" : "s ne sont pas affichés"} : l'appli n'est pas sur ce téléphone ou il n'y a pas de données.`,
    noBars: "Aucune utilisation mesurée sur ce téléphone pendant cette période.",
    more: "Voir le détail",
    checkIn: {
      title: "Utilisation par abonnement",
      basis: "D'après les check-ins",
      legend:
        "Une barre pleine signifie que le seuil « rentable » est atteint (par mois : 4 visionnages, 10 jours d'IA ou 10 heures de musique). La couleur est l'évaluation du check-in.",
      pending: (n) =>
        n === 1
          ? "1 abonnement sans check-in n'est pas affiché."
          : `${n} abonnements sans check-in ne sont pas affichés.`,
      other: (n) =>
        n === 1
          ? "1 abonnement mesuré par avantages ou stockage est affiché plus bas."
          : `${n} abonnements mesurés par avantages ou stockage sont affichés plus bas.`,
      empty:
        "Aucun check-in pour l'instant. Indiquez votre utilisation des 30 derniers jours sur le tableau de bord pour voir une barre ici.",
      appHint:
        "Dans l'application Android, les barres montrent le temps d'utilisation relevé par le téléphone.",
    },
  },
};

export const es: Widen<typeof ko> = {
  usageChart: {
    title: "Tiempo de uso por suscripción",
    modeLabel: "Periodo",
    recent: "Últimos 30 días",
    monthly: "Por mes",
    pending: "Sin valorar",
    legend:
      "El color de las barras indica cuánto vale lo que pagas (mismo criterio que los check-ins). Hasta reunir 30 días de datos, una barra toma el color de tu último registro, o queda en gris si no hay. Se vuelve verde en cuanto llega al nivel «vale la pena».",
    partialMonth: "Este mes solo cuenta los días con datos.",
    excluded: (n) =>
      `${n} suscripci${n === 1 ? "ón no se muestra" : "ones no se muestran"} porque la app no está en este teléfono o no hay datos.`,
    noBars: "No se midió uso en este teléfono en este periodo.",
    more: "Ver detalles",
    checkIn: {
      title: "Uso por suscripción",
      basis: "Según los registros",
      legend:
        "Una barra llena significa que llegó al nivel «vale la pena» (al mes: 4 usos de streaming, 10 días de IA o 10 horas de música). El color es la valoración del registro.",
      pending: (n) =>
        n === 1
          ? "1 suscripción sin registro queda fuera."
          : `${n} suscripciones sin registro quedan fuera.`,
      other: (n) =>
        n === 1
          ? "1 suscripción medida por beneficios o almacenamiento aparece más abajo."
          : `${n} suscripciones medidas por beneficios o almacenamiento aparecen más abajo.`,
      empty:
        "Aún no hay registros. Indica en el panel cuánto usaste una suscripción en los últimos 30 días y aparecerá una barra aquí.",
      appHint:
        "En la app de Android, las barras muestran el tiempo de uso registrado por el móvil.",
    },
  },
};

export const de: Widen<typeof ko> = {
  usageChart: {
    title: "Nutzungszeit je Abo",
    modeLabel: "Zeitraum",
    recent: "Letzte 30 Tage",
    monthly: "Nach Monat",
    pending: "Noch nicht bewertet",
    legend:
      "Die Balkenfarbe zeigt das Preis-Leistungs-Verhältnis (gleiche Regel wie beim Check-in). Bis 30 Tage Daten da sind, übernimmt ein Balken die Farbe des letzten Check-ins, ohne Check-in bleibt er grau. Sobald die Schwelle „lohnt sich“ erreicht ist, wird er grün.",
    partialMonth: "Dieser Monat zählt nur Tage mit Daten.",
    excluded: (n) =>
      `${n} Abo${n === 1 ? " wird" : "s werden"} nicht gezeigt, weil die App nicht auf diesem Handy ist oder keine Daten da sind.`,
    noBars: "In diesem Zeitraum wurde auf diesem Handy keine Nutzung gemessen.",
    more: "Details ansehen",
    checkIn: {
      title: "Nutzung pro Abo",
      basis: "Nach Check-ins",
      legend:
        "Ein voller Balken heißt, die Schwelle „lohnt sich“ ist erreicht (pro Monat 4-mal Streaming, 10 Tage KI oder 10 Stunden Musik). Die Farbe ist die Bewertung des Check-ins.",
      pending: (n) => (n === 1 ? "1 Abo ohne Check-in fehlt." : `${n} Abos ohne Check-in fehlen.`),
      other: (n) =>
        n === 1
          ? "1 Abo, das nach Vorteilen oder Speicher gemessen wird, steht weiter unten."
          : `${n} Abos, die nach Vorteilen oder Speicher gemessen werden, stehen weiter unten.`,
      empty:
        "Noch keine Check-ins. Gib im Dashboard an, wie viel du ein Abo in den letzten 30 Tagen genutzt hast, dann erscheint hier ein Balken.",
      appHint: "In der Android-App zeigen die Balken die vom Handy erfasste Nutzungszeit.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  usageChart: {
    title: "Tempo de uso por assinatura",
    modeLabel: "Período",
    recent: "Últimos 30 dias",
    monthly: "Por mês",
    pending: "Ainda sem avaliação",
    legend:
      'A cor das barras mostra o custo-benefício (mesmo critério do check-in). Até juntar 30 dias de dados, a barra usa a cor do último registro, ou fica cinza se não houver. Ela fica verde assim que chega ao nível "vale a pena".',
    partialMonth: "Este mês conta só os dias com dados.",
    excluded: (n) =>
      `${n} assinatura${n === 1 ? " não aparece" : "s não aparecem"} porque o app não está neste celular ou não há dados.`,
    noBars: "Nenhum uso medido neste celular neste período.",
    more: "Ver detalhes",
    checkIn: {
      title: "Uso por assinatura",
      basis: "Pelos registros",
      legend:
        'Barra cheia quer dizer que chegou ao nível "vale a pena" (por mês: 4 usos de streaming, 10 dias de IA ou 10 horas de música). A cor é a avaliação do registro.',
      pending: (n) =>
        n === 1
          ? "1 assinatura sem registro fica de fora."
          : `${n} assinaturas sem registro ficam de fora.`,
      other: (n) =>
        n === 1
          ? "1 assinatura medida por benefícios ou armazenamento aparece mais abaixo."
          : `${n} assinaturas medidas por benefícios ou armazenamento aparecem mais abaixo.`,
      empty:
        "Ainda não há registros. Informe no painel quanto você usou uma assinatura nos últimos 30 dias e uma barra aparece aqui.",
      appHint: "No app Android, as barras mostram o tempo de uso registrado pelo celular.",
    },
  },
};
