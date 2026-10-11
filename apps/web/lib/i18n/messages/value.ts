import { CATEGORY_LABELS, DETOX_LEVEL_TIERS } from "@subslash/shared";
import type { Widen } from "../types";

/**
 * 체크인 기록 한 줄과 비유 문구의 조각. 숫자와 금액은 부르는 쪽이 만들어 넘기고(`formatCurrency`는 ₩·$ 표기라 언어와
 * 무관하다), 여기서는 말만 붙인다. 지표 조합은 `lib/i18n/check-in-text`가 맡는다.
 */
function koCount(raw: number): string {
  const n = Number(raw); // 문구 검사가 글자를 넘기기도 한다.
  if (n >= 10) return Math.floor(n).toString();
  if (n >= 1) return n.toFixed(1).replace(/\.0$/, "");
  if (n >= 0.1) return n.toFixed(1);
  return "0.1 미만";
}

function enCount(raw: number): { text: string; one: boolean } {
  const n = Number(raw);
  if (n >= 10) return { text: Math.floor(n).toString(), one: false };
  if (n >= 1) {
    const text = n.toFixed(1).replace(/\.0$/, "");
    return { text, one: text === "1" };
  }
  if (n >= 0.1) return { text: n.toFixed(1), one: false };
  return { text: "under 0.1", one: false };
}

export const ko = {
  checkIn: {
    /** 수량: '12회 이용', '30일 중 8일 사용', '15시간 사용', '용량의 40% 사용'. */
    uses: (n: number) => `${n}회 이용`,
    days: (n: number) => `30일 중 ${n}일 사용`,
    hours: (n: number) => `${n}시간 사용`,
    benefit: (amount: string) => `혜택 ${amount}`,
    storage: (percent: number) => `용량의 ${percent}% 사용`,
    /** 단가: '1회당 ₩3,000', '안 썼어요', '회비의 80% 돌려받음'. */
    perUse: (cost: string) => `1회당 ${cost}`,
    perDay: (cost: string) => `하루당 ${cost}`,
    perHour: (cost: string) => `시간당 ${cost}`,
    notUsed: "안 썼어요",
    benefitReturned: (percent: number) => `회비의 ${percent}% 돌려받음`,
    /** 표의 단가 칸처럼 좁은 자리: '₩1,000/일', '안 씀', '80% 환급', '40% 사용'. */
    shortPerDay: (cost: string) => `${cost}/일`,
    shortPerHour: (cost: string) => `${cost}/시간`,
    shortNotUsed: "안 씀",
    shortReturned: (percent: number) => `${percent}% 환급`,
    shortStorage: (percent: number) => `${percent}% 사용`,
    shortNone: "-",
  },
  /** 구독 분류 이름. 한국어는 `CATEGORY_LABELS`가 원문이다. */
  category: CATEGORY_LABELS,
  /** 디톡스 레벨 칭호(레벨 번호가 키). 한국어는 `DETOX_LEVEL_TIERS`가 원문이다. */
  detoxTitle: {
    0: DETOX_LEVEL_TIERS[0].title,
    1: DETOX_LEVEL_TIERS[1].title,
    2: DETOX_LEVEL_TIERS[2].title,
    3: DETOX_LEVEL_TIERS[3].title,
    4: DETOX_LEVEL_TIERS[4].title,
    5: DETOX_LEVEL_TIERS[5].title,
  },
  /** 아낀 돈으로 살 수 있는 것: '맛있는 치킨 3마리'. */
  reward: {
    latte: (n: number) => `카페 라떼 ${Number(n).toLocaleString("ko-KR")}잔`,
    chicken: (n: number) => `맛있는 치킨 ${Number(n).toLocaleString("ko-KR")}마리`,
    dinner: (n: number) => `고급 레스토랑 저녁 ${Number(n).toLocaleString("ko-KR")}회`,
    trip: (n: number) => `가까운 해외 여행 ${Number(n).toLocaleString("ko-KR")}회`,
  },
  /** 금액과 가장 가까운 소비재 몇 개 값인지. */
  metaphor: {
    coffee: (n: number) => `커피 ${koCount(n)}잔`,
    movie: (n: number) => `영화관 티켓 ${koCount(n)}장`,
    chicken: (n: number) => `치킨 ${koCount(n)}마리`,
    delivery: (n: number) => `배달팁 ${koCount(n)}회`,
  },
};

export const en: Widen<typeof ko> = {
  category: {
    ott: "OTT",
    music: "Music",
    cloud: "Cloud",
    shopping: "Shopping",
    ai: "AI tools",
    other: "Other",
  },
  detoxTitle: {
    0: "Getting ready",
    1: "Subscription sprout",
    2: "Detox explorer",
    3: "Smart slasher",
    4: "Spending defense commander",
    5: "Subscription killer · minimalist",
  },
  reward: {
    latte: (n) =>
      `${Number(n).toLocaleString("en-US")} café ${Number(n) === 1 ? "latte" : "lattes"}`,
    chicken: (n) =>
      `${Number(n).toLocaleString("en-US")} ${Number(n) === 1 ? "order" : "orders"} of fried chicken`,
    dinner: (n) =>
      `${Number(n).toLocaleString("en-US")} fine-dining ${Number(n) === 1 ? "dinner" : "dinners"}`,
    trip: (n) =>
      `${Number(n).toLocaleString("en-US")} nearby overseas ${Number(n) === 1 ? "trip" : "trips"}`,
  },
  checkIn: {
    uses: (n) => (n === 1 ? "1 use" : `${n} uses`),
    days: (n) => `${n} of 30 days used`,
    hours: (n) => (n === 1 ? "1 hour used" : `${n} hours used`),
    benefit: (amount) => `${amount} in benefits`,
    storage: (percent) => `${percent}% of storage used`,
    perUse: (cost) => `${cost} per use`,
    perDay: (cost) => `${cost} per day`,
    perHour: (cost) => `${cost} per hour`,
    notUsed: "Not used",
    benefitReturned: (percent) => `${percent}% of the fee earned back`,
    shortPerDay: (cost) => `${cost}/day`,
    shortPerHour: (cost) => `${cost}/hour`,
    shortNotUsed: "Unused",
    shortReturned: (percent) => `${percent}% back`,
    shortStorage: (percent) => `${percent}% used`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => {
      const c = enCount(n);
      return `${c.text} ${c.one ? "cup" : "cups"} of coffee`;
    },
    movie: (n) => {
      const c = enCount(n);
      return `${c.text} movie ${c.one ? "ticket" : "tickets"}`;
    },
    chicken: (n) => {
      const c = enCount(n);
      return `${c.text} ${c.one ? "order" : "orders"} of fried chicken`;
    },
    delivery: (n) => {
      const c = enCount(n);
      return `${c.text} delivery ${c.one ? "fee" : "fees"}`;
    },
  },
};

/** 영어 밖의 언어가 비유 숫자를 적는 규칙(`enCount`와 같다). 0.1 미만은 그 언어의 '0.1 미만'이다. */
function countIn(raw: number, intl: string, under: string): string {
  const n = Number(raw);
  if (n >= 10) return Math.floor(n).toLocaleString(intl);
  if (n >= 1)
    return n
      .toFixed(1)
      .replace(/\.0$/, "")
      .replace(".", intl === "en-US" ? "." : decimalOf(intl));
  if (n >= 0.1) return n.toFixed(1).replace(".", decimalOf(intl));
  return under;
}

function decimalOf(intl: string): string {
  return (1.5).toLocaleString(intl).charAt(1);
}

export const zh: Widen<typeof ko> = {
  category: {
    ott: "OTT",
    music: "音乐",
    cloud: "云存储",
    shopping: "购物",
    ai: "AI 工具",
    other: "其他",
  },
  detoxTitle: {
    0: "准备排毒",
    1: "订阅新芽",
    2: "排毒探险家",
    3: "精明砍订者",
    4: "支出防御指挥官",
    5: "订阅杀手 · 极简主义者",
  },
  reward: {
    latte: (n) => `${Number(n).toLocaleString("zh-CN")} 杯拿铁`,
    chicken: (n) => `${Number(n).toLocaleString("zh-CN")} 份炸鸡`,
    dinner: (n) => `${Number(n).toLocaleString("zh-CN")} 顿高级餐厅晚餐`,
    trip: (n) => `${Number(n).toLocaleString("zh-CN")} 次周边国家旅行`,
  },
  checkIn: {
    uses: (n) => `使用 ${n} 次`,
    days: (n) => `30 天中用了 ${n} 天`,
    hours: (n) => `使用 ${n} 小时`,
    benefit: (amount) => `获得优惠 ${amount}`,
    storage: (percent) => `已用存储空间的 ${percent}%`,
    perUse: (cost) => `每次 ${cost}`,
    perDay: (cost) => `每天 ${cost}`,
    perHour: (cost) => `每小时 ${cost}`,
    notUsed: "没用过",
    benefitReturned: (percent) => `收回会费的 ${percent}%`,
    shortPerDay: (cost) => `${cost}/天`,
    shortPerHour: (cost) => `${cost}/小时`,
    shortNotUsed: "未使用",
    shortReturned: (percent) => `返还 ${percent}%`,
    shortStorage: (percent) => `已用 ${percent}%`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => `${countIn(n, "zh-CN", "不到 0.1")} 杯咖啡`,
    movie: (n) => `${countIn(n, "zh-CN", "不到 0.1")} 张电影票`,
    chicken: (n) => `${countIn(n, "zh-CN", "不到 0.1")} 份炸鸡`,
    delivery: (n) => `${countIn(n, "zh-CN", "不到 0.1")} 次外卖配送费`,
  },
};

export const ja: Widen<typeof ko> = {
  category: {
    ott: "OTT",
    music: "音楽",
    cloud: "クラウド",
    shopping: "ショッピング",
    ai: "AI ツール",
    other: "その他",
  },
  detoxTitle: {
    0: "デトックス準備中",
    1: "サブスクの芽",
    2: "デトックス探検家",
    3: "スマートスラッシャー",
    4: "支出防衛司令官",
    5: "サブスクキラー · ミニマリスト",
  },
  reward: {
    latte: (n) => `カフェラテ ${Number(n).toLocaleString("ja-JP")} 杯`,
    chicken: (n) => `フライドチキン ${Number(n).toLocaleString("ja-JP")} 羽`,
    dinner: (n) => `高級レストランのディナー ${Number(n).toLocaleString("ja-JP")} 回`,
    trip: (n) => `近場の海外旅行 ${Number(n).toLocaleString("ja-JP")} 回`,
  },
  checkIn: {
    uses: (n) => `${n} 回利用`,
    days: (n) => `30 日中 ${n} 日利用`,
    hours: (n) => `${n} 時間利用`,
    benefit: (amount) => `特典 ${amount}`,
    storage: (percent) => `容量の ${percent}% を使用`,
    perUse: (cost) => `1 回 ${cost}`,
    perDay: (cost) => `1 日 ${cost}`,
    perHour: (cost) => `1 時間 ${cost}`,
    notUsed: "使っていません",
    benefitReturned: (percent) => `会費の ${percent}% を回収`,
    shortPerDay: (cost) => `${cost}/日`,
    shortPerHour: (cost) => `${cost}/時間`,
    shortNotUsed: "未使用",
    shortReturned: (percent) => `${percent}% 回収`,
    shortStorage: (percent) => `${percent}% 使用`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => `コーヒー ${countIn(n, "ja-JP", "0.1 未満")} 杯`,
    movie: (n) => `映画のチケット ${countIn(n, "ja-JP", "0.1 未満")} 枚`,
    chicken: (n) => `フライドチキン ${countIn(n, "ja-JP", "0.1 未満")} 羽`,
    delivery: (n) => `配達料 ${countIn(n, "ja-JP", "0.1 未満")} 回分`,
  },
};

export const vi: Widen<typeof ko> = {
  category: {
    ott: "OTT",
    music: "Âm nhạc",
    cloud: "Đám mây",
    shopping: "Mua sắm",
    ai: "Công cụ AI",
    other: "Khác",
  },
  detoxTitle: {
    0: "Chuẩn bị cai nghiện",
    1: "Mầm đăng ký",
    2: "Nhà thám hiểm cai nghiện",
    3: "Người cắt giảm thông minh",
    4: "Chỉ huy phòng thủ chi tiêu",
    5: "Sát thủ đăng ký · người tối giản",
  },
  reward: {
    latte: (n) => `${Number(n).toLocaleString("vi-VN")} ly cà phê latte`,
    chicken: (n) => `${Number(n).toLocaleString("vi-VN")} phần gà rán`,
    dinner: (n) => `${Number(n).toLocaleString("vi-VN")} bữa tối nhà hàng sang trọng`,
    trip: (n) => `${Number(n).toLocaleString("vi-VN")} chuyến du lịch nước ngoài gần`,
  },
  checkIn: {
    uses: (n) => `Dùng ${n} lần`,
    days: (n) => `Dùng ${n}/30 ngày`,
    hours: (n) => `Dùng ${n} giờ`,
    benefit: (amount) => `Ưu đãi ${amount}`,
    storage: (percent) => `Đã dùng ${percent}% dung lượng`,
    perUse: (cost) => `${cost} mỗi lần`,
    perDay: (cost) => `${cost} mỗi ngày`,
    perHour: (cost) => `${cost} mỗi giờ`,
    notUsed: "Chưa dùng",
    benefitReturned: (percent) => `Thu lại ${percent}% phí`,
    shortPerDay: (cost) => `${cost}/ngày`,
    shortPerHour: (cost) => `${cost}/giờ`,
    shortNotUsed: "Chưa dùng",
    shortReturned: (percent) => `Thu lại ${percent}%`,
    shortStorage: (percent) => `Đã dùng ${percent}%`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => `${countIn(n, "vi-VN", "dưới 0,1")} ly cà phê`,
    movie: (n) => `${countIn(n, "vi-VN", "dưới 0,1")} vé xem phim`,
    chicken: (n) => `${countIn(n, "vi-VN", "dưới 0,1")} phần gà rán`,
    delivery: (n) => `${countIn(n, "vi-VN", "dưới 0,1")} lần phí giao hàng`,
  },
};

export const fr: Widen<typeof ko> = {
  category: {
    ott: "Streaming",
    music: "Musique",
    cloud: "Cloud",
    shopping: "Shopping",
    ai: "Outils IA",
    other: "Autre",
  },
  detoxTitle: {
    0: "En préparation",
    1: "Pousse d'abonnement",
    2: "Explorateur de la détox",
    3: "Trancheur avisé",
    4: "Commandant de la défense des dépenses",
    5: "Tueur d'abonnements · minimaliste",
  },
  reward: {
    latte: (n) => `${Number(n).toLocaleString("fr-FR")} café${Number(n) === 1 ? "" : "s"} latte`,
    chicken: (n) =>
      `${Number(n).toLocaleString("fr-FR")} portion${Number(n) === 1 ? "" : "s"} de poulet frit`,
    dinner: (n) =>
      `${Number(n).toLocaleString("fr-FR")} dîner${Number(n) === 1 ? "" : "s"} gastronomique${Number(n) === 1 ? "" : "s"}`,
    trip: (n) =>
      `${Number(n).toLocaleString("fr-FR")} voyage${Number(n) === 1 ? "" : "s"} à l'étranger tout proche`,
  },
  checkIn: {
    uses: (n) => `${n} utilisation${Number(n) === 1 ? "" : "s"}`,
    days: (n) =>
      `${n} jour${Number(n) === 1 ? "" : "s"} utilisé${Number(n) === 1 ? "" : "s"} sur 30`,
    hours: (n) => `${n} heure${Number(n) === 1 ? "" : "s"} d'utilisation`,
    benefit: (amount) => `${amount} d'avantages`,
    storage: (percent) => `${percent} % du stockage utilisé`,
    perUse: (cost) => `${cost} par utilisation`,
    perDay: (cost) => `${cost} par jour`,
    perHour: (cost) => `${cost} par heure`,
    notUsed: "Pas utilisé",
    benefitReturned: (percent) => `${percent} % de l'abonnement récupéré`,
    shortPerDay: (cost) => `${cost}/jour`,
    shortPerHour: (cost) => `${cost}/heure`,
    shortNotUsed: "Inutilisé",
    shortReturned: (percent) => `${percent} % récupéré`,
    shortStorage: (percent) => `${percent} % utilisé`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => `${countIn(n, "fr-FR", "moins de 0,1")} café${Number(n) >= 2 ? "s" : ""}`,
    movie: (n) =>
      `${countIn(n, "fr-FR", "moins de 0,1")} place${Number(n) >= 2 ? "s" : ""} de cinéma`,
    chicken: (n) =>
      `${countIn(n, "fr-FR", "moins de 0,1")} portion${Number(n) >= 2 ? "s" : ""} de poulet frit`,
    delivery: (n) => `${countIn(n, "fr-FR", "moins de 0,1")} frais de livraison`,
  },
};

export const es: Widen<typeof ko> = {
  category: {
    ott: "Streaming",
    music: "Música",
    cloud: "Nube",
    shopping: "Compras",
    ai: "Herramientas IA",
    other: "Otros",
  },
  detoxTitle: {
    0: "Preparando el detox",
    1: "Brote de suscripción",
    2: "Explorador del detox",
    3: "Recortador inteligente",
    4: "Comandante de defensa del gasto",
    5: "Asesino de suscripciones · minimalista",
  },
  reward: {
    latte: (n) =>
      `${Number(n).toLocaleString("es-ES")} café${Number(n) === 1 ? "" : "s"} con leche`,
    chicken: (n) =>
      `${Number(n).toLocaleString("es-ES")} ración${Number(n) === 1 ? "" : "es"} de pollo frito`.replace(
        "raciónes",
        "raciones",
      ),
    dinner: (n) =>
      `${Number(n).toLocaleString("es-ES")} cena${Number(n) === 1 ? "" : "s"} en un restaurante de lujo`,
    trip: (n) =>
      `${Number(n).toLocaleString("es-ES")} viaje${Number(n) === 1 ? "" : "s"} al extranjero cercano`,
  },
  checkIn: {
    uses: (n) => `${n} uso${Number(n) === 1 ? "" : "s"}`,
    days: (n) => `${n} de 30 días usado`,
    hours: (n) => `${n} hora${Number(n) === 1 ? "" : "s"} de uso`,
    benefit: (amount) => `${amount} en ventajas`,
    storage: (percent) => `${percent} % del almacenamiento usado`,
    perUse: (cost) => `${cost} por uso`,
    perDay: (cost) => `${cost} por día`,
    perHour: (cost) => `${cost} por hora`,
    notUsed: "Sin usar",
    benefitReturned: (percent) => `${percent} % de la cuota recuperado`,
    shortPerDay: (cost) => `${cost}/día`,
    shortPerHour: (cost) => `${cost}/hora`,
    shortNotUsed: "Sin usar",
    shortReturned: (percent) => `${percent} % recuperado`,
    shortStorage: (percent) => `${percent} % usado`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => `${countIn(n, "es-ES", "menos de 0,1")} café${Number(n) >= 2 ? "s" : ""}`,
    movie: (n) =>
      `${countIn(n, "es-ES", "menos de 0,1")} entrada${Number(n) >= 2 ? "s" : ""} de cine`,
    chicken: (n) =>
      `${countIn(n, "es-ES", "menos de 0,1")} ración${Number(n) >= 2 ? "es" : ""} de pollo frito`.replace(
        "raciónes",
        "raciones",
      ),
    delivery: (n) =>
      `${countIn(n, "es-ES", "menos de 0,1")} gasto${Number(n) >= 2 ? "s" : ""} de envío`,
  },
};

export const de: Widen<typeof ko> = {
  category: {
    ott: "Streaming",
    music: "Musik",
    cloud: "Cloud",
    shopping: "Shopping",
    ai: "KI-Tools",
    other: "Sonstiges",
  },
  detoxTitle: {
    0: "Detox-Vorbereitung",
    1: "Abo-Spross",
    2: "Detox-Entdecker",
    3: "Smarter Kürzer",
    4: "Kommandant der Ausgabenabwehr",
    5: "Abo-Killer · Minimalist",
  },
  reward: {
    latte: (n) => `${Number(n).toLocaleString("de-DE")} Latte macchiato`,
    chicken: (n) =>
      `${Number(n).toLocaleString("de-DE")} ${Number(n) === 1 ? "Portion" : "Portionen"} Brathähnchen`,
    dinner: (n) =>
      `${Number(n).toLocaleString("de-DE")} ${Number(n) === 1 ? "Abendessen" : "Abendessen"} im Sterne-Restaurant`,
    trip: (n) =>
      `${Number(n).toLocaleString("de-DE")} ${Number(n) === 1 ? "Reise" : "Reisen"} ins nahe Ausland`,
  },
  checkIn: {
    uses: (n) => `${n}-mal genutzt`,
    days: (n) => `An ${n} von 30 Tagen genutzt`,
    hours: (n) => `${n} ${Number(n) === 1 ? "Stunde" : "Stunden"} genutzt`,
    benefit: (amount) => `${amount} an Vorteilen`,
    storage: (percent) => `${percent} % des Speichers genutzt`,
    perUse: (cost) => `${cost} pro Nutzung`,
    perDay: (cost) => `${cost} pro Tag`,
    perHour: (cost) => `${cost} pro Stunde`,
    notUsed: "Nicht genutzt",
    benefitReturned: (percent) => `${percent} % der Gebühr zurückgeholt`,
    shortPerDay: (cost) => `${cost}/Tag`,
    shortPerHour: (cost) => `${cost}/Std.`,
    shortNotUsed: "Ungenutzt",
    shortReturned: (percent) => `${percent} % zurück`,
    shortStorage: (percent) => `${percent} % genutzt`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) =>
      `${countIn(n, "de-DE", "unter 0,1")} ${Number(n) >= 2 ? "Tassen" : "Tasse"} Kaffee`,
    movie: (n) =>
      `${countIn(n, "de-DE", "unter 0,1")} ${Number(n) >= 2 ? "Kinotickets" : "Kinoticket"}`,
    chicken: (n) =>
      `${countIn(n, "de-DE", "unter 0,1")} ${Number(n) >= 2 ? "Portionen" : "Portion"} Brathähnchen`,
    delivery: (n) =>
      `${countIn(n, "de-DE", "unter 0,1")} ${Number(n) >= 2 ? "Liefergebühren" : "Liefergebühr"}`,
  },
};

export const pt: Widen<typeof ko> = {
  category: {
    ott: "Streaming",
    music: "Música",
    cloud: "Nuvem",
    shopping: "Compras",
    ai: "Ferramentas de IA",
    other: "Outros",
  },
  detoxTitle: {
    0: "Preparando o detox",
    1: "Broto de assinatura",
    2: "Explorador do detox",
    3: "Cortador esperto",
    4: "Comandante da defesa de gastos",
    5: "Matador de assinaturas · minimalista",
  },
  reward: {
    latte: (n) =>
      `${Number(n).toLocaleString("pt-BR")} café${Number(n) === 1 ? "" : "s"} com leite`,
    chicken: (n) =>
      `${Number(n).toLocaleString("pt-BR")} porç${Number(n) === 1 ? "ão" : "ões"} de frango frito`,
    dinner: (n) =>
      `${Number(n).toLocaleString("pt-BR")} jantar${Number(n) === 1 ? "" : "es"} em restaurante chique`,
    trip: (n) =>
      `${Number(n).toLocaleString("pt-BR")} viage${Number(n) === 1 ? "m" : "ns"} para um país vizinho`,
  },
  checkIn: {
    uses: (n) => `${n} uso${Number(n) === 1 ? "" : "s"}`,
    days: (n) => `${n} de 30 dias usados`,
    hours: (n) => `${n} hora${Number(n) === 1 ? "" : "s"} de uso`,
    benefit: (amount) => `${amount} em benefícios`,
    storage: (percent) => `${percent}% do armazenamento usado`,
    perUse: (cost) => `${cost} por uso`,
    perDay: (cost) => `${cost} por dia`,
    perHour: (cost) => `${cost} por hora`,
    notUsed: "Não usou",
    benefitReturned: (percent) => `${percent}% da mensalidade recuperado`,
    shortPerDay: (cost) => `${cost}/dia`,
    shortPerHour: (cost) => `${cost}/hora`,
    shortNotUsed: "Sem uso",
    shortReturned: (percent) => `${percent}% de volta`,
    shortStorage: (percent) => `${percent}% usado`,
    shortNone: "-",
  },
  metaphor: {
    coffee: (n) => `${countIn(n, "pt-BR", "menos de 0,1")} café${Number(n) >= 2 ? "s" : ""}`,
    movie: (n) =>
      `${countIn(n, "pt-BR", "menos de 0,1")} ingresso${Number(n) >= 2 ? "s" : ""} de cinema`,
    chicken: (n) =>
      `${countIn(n, "pt-BR", "menos de 0,1")} porç${Number(n) >= 2 ? "ões" : "ão"} de frango frito`,
    delivery: (n) =>
      `${countIn(n, "pt-BR", "menos de 0,1")} taxa${Number(n) >= 2 ? "s" : ""} de entrega`,
  },
};
