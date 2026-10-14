import type { Widen } from "../types";

/** 리포트의 '구독별 사용 시간' 막대그래프(`UsageTimeChart`, 안드로이드 앱의 폰 사용 기록). */
export const ko = {
  usageChart: {
    title: "구독별 사용 시간",
    modeLabel: "기간",
    recent: "최근 30일",
    monthly: "월별",
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    pending: "평가 전",
    legend:
      "막대 색은 가성비예요(체크인과 같은 기준). 30일 치 기록이 모이기 전에는 회색으로 두고 평가하지 않아요.",
    partialMonth: "이 달은 기록이 있는 날만 셌어요.",
    excluded: (n: number) => `이 폰에 앱이 없거나 기록이 없는 구독 ${n}개는 빠져 있어요.`,
    noBars: "이 기간에 이 폰에서 잰 사용 기록이 없어요.",
    more: "자세히 보기",
  },
};

export const en: Widen<typeof ko> = {
  usageChart: {
    title: "Usage time by subscription",
    modeLabel: "Period",
    recent: "Last 30 days",
    monthly: "By month",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    pending: "Not rated yet",
    legend:
      "Bar colors show value for money (same rule as check-ins). Until 30 days of records are in, bars stay gray and aren't rated.",
    partialMonth: "This month counts only the days with records.",
    excluded: (n) =>
      `${n} ${n === 1 ? "subscription isn't" : "subscriptions aren't"} shown because the app isn't on this phone or there are no records.`,
    noBars: "No usage was measured on this phone in this period.",
    more: "See details",
  },
};

export const zh: Widen<typeof ko> = {
  usageChart: {
    title: "各订阅使用时间",
    modeLabel: "期间",
    recent: "最近 30 天",
    monthly: "按月",
    prevMonth: "上个月",
    nextMonth: "下个月",
    pending: "尚未评价",
    legend: "柱子颜色表示性价比（与打卡相同的标准）。记录未满 30 天前显示为灰色，不作评价。",
    partialMonth: "本月只计算有记录的日子。",
    excluded: (n) => `有 ${n} 个订阅因本手机未安装应用或没有记录而未显示。`,
    noBars: "这段时间本手机没有测到使用记录。",
    more: "查看详情",
  },
};

export const ja: Widen<typeof ko> = {
  usageChart: {
    title: "サブスク別の利用時間",
    modeLabel: "期間",
    recent: "直近30日",
    monthly: "月別",
    prevMonth: "前の月",
    nextMonth: "次の月",
    pending: "評価前",
    legend:
      "棒の色はコスパです（チェックインと同じ基準）。30日分の記録がそろうまではグレーで、評価しません。",
    partialMonth: "この月は記録がある日だけを数えています。",
    excluded: (n) => `この端末にアプリがないか記録がないサブスク ${n} 件は表示していません。`,
    noBars: "この期間、この端末で計測した利用記録はありません。",
    more: "詳しく見る",
  },
};

export const vi: Widen<typeof ko> = {
  usageChart: {
    title: "Thời gian dùng theo gói",
    modeLabel: "Khoảng thời gian",
    recent: "30 ngày qua",
    monthly: "Theo tháng",
    prevMonth: "Tháng trước",
    nextMonth: "Tháng sau",
    pending: "Chưa đánh giá",
    legend:
      "Màu cột thể hiện độ đáng tiền (cùng tiêu chí với check-in). Khi chưa đủ 30 ngày dữ liệu, cột để màu xám và chưa đánh giá.",
    partialMonth: "Tháng này chỉ tính những ngày có dữ liệu.",
    excluded: (n) =>
      `${n} gói không hiển thị vì điện thoại này không có ứng dụng hoặc chưa có dữ liệu.`,
    noBars: "Không đo được thời gian dùng trên điện thoại này trong khoảng thời gian này.",
    more: "Xem chi tiết",
  },
};

export const fr: Widen<typeof ko> = {
  usageChart: {
    title: "Temps d'utilisation par abonnement",
    modeLabel: "Période",
    recent: "30 derniers jours",
    monthly: "Par mois",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    pending: "Pas encore évalué",
    legend:
      "La couleur des barres indique le rapport qualité-prix (même règle que les check-ins). Tant que 30 jours de données ne sont pas réunis, elles restent grises et ne sont pas évaluées.",
    partialMonth: "Ce mois ne compte que les jours avec des données.",
    excluded: (n) =>
      `${n} abonnement${n === 1 ? " n'est pas affiché" : "s ne sont pas affichés"} : l'appli n'est pas sur ce téléphone ou il n'y a pas de données.`,
    noBars: "Aucune utilisation mesurée sur ce téléphone pendant cette période.",
    more: "Voir le détail",
  },
};

export const es: Widen<typeof ko> = {
  usageChart: {
    title: "Tiempo de uso por suscripción",
    modeLabel: "Periodo",
    recent: "Últimos 30 días",
    monthly: "Por mes",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    pending: "Sin valorar",
    legend:
      "El color de las barras indica cuánto vale lo que pagas (mismo criterio que los check-ins). Hasta reunir 30 días de datos quedan en gris y no se valoran.",
    partialMonth: "Este mes solo cuenta los días con datos.",
    excluded: (n) =>
      `${n} suscripci${n === 1 ? "ón no se muestra" : "ones no se muestran"} porque la app no está en este teléfono o no hay datos.`,
    noBars: "No se midió uso en este teléfono en este periodo.",
    more: "Ver detalles",
  },
};

export const de: Widen<typeof ko> = {
  usageChart: {
    title: "Nutzungszeit je Abo",
    modeLabel: "Zeitraum",
    recent: "Letzte 30 Tage",
    monthly: "Nach Monat",
    prevMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    pending: "Noch nicht bewertet",
    legend:
      "Die Balkenfarbe zeigt das Preis-Leistungs-Verhältnis (gleiche Regel wie beim Check-in). Bis 30 Tage Daten da sind, bleiben die Balken grau und unbewertet.",
    partialMonth: "Dieser Monat zählt nur Tage mit Daten.",
    excluded: (n) =>
      `${n} Abo${n === 1 ? " wird" : "s werden"} nicht gezeigt, weil die App nicht auf diesem Handy ist oder keine Daten da sind.`,
    noBars: "In diesem Zeitraum wurde auf diesem Handy keine Nutzung gemessen.",
    more: "Details ansehen",
  },
};

export const pt: Widen<typeof ko> = {
  usageChart: {
    title: "Tempo de uso por assinatura",
    modeLabel: "Período",
    recent: "Últimos 30 dias",
    monthly: "Por mês",
    prevMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    pending: "Ainda sem avaliação",
    legend:
      "A cor das barras mostra o custo-benefício (mesmo critério do check-in). Até juntar 30 dias de dados, elas ficam cinza e sem avaliação.",
    partialMonth: "Este mês conta só os dias com dados.",
    excluded: (n) =>
      `${n} assinatura${n === 1 ? " não aparece" : "s não aparecem"} porque o app não está neste celular ou não há dados.`,
    noBars: "Nenhum uso medido neste celular neste período.",
    more: "Ver detalhes",
  },
};
