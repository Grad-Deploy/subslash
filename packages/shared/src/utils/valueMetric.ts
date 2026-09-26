import type { Currency, RiskLevel, Subscription, UsageLog } from "../types";
import { findPresetForSubscription } from "../constants/services";
import {
  calculateCostPerUse,
  formatCurrency,
  formatShockMessage,
  getRiskLevel,
} from "./cost-per-use";

/**
 * 구독의 돈값을 무엇으로 재는지.
 *
 * '몇 번 썼나'는 OTT에는 맞지만 다른 구독에는 틀린 답을 낸다 — 음악은 화면을 끄고 듣고, 멤버십은 앱을
 * 여는 것과 혜택을 받는 것이 다르고, 저장 공간은 열지 않아도 제 일을 한다. 그래서 서비스마다 재는 것을
 * 정한다.
 *
 * 체크인 기록의 모양은 그대로다: `usageCount`는 이 지표의 수량이고, `costPerUse`는 한 달치 내 몫 ÷
 * 수량(수량이 0이면 한 달치 그대로)이다. 그래서 `costPerUse × usageCount`로 한 달치를 되짚는 계산
 * (checkInEvidence)이 모든 지표에서 맞는다. 지표마다 다른 것은 묻는 말·단위·색 기준뿐이다.
 *
 * - `uses`: 최근 30일 동안 쓴 횟수 → 1회당 금액 (OTT 등, 예전부터의 체크인)
 * - `days`: 최근 30일 중 쓴 날 수 → 하루당 금액 (AI·업무 도구 — 짧게 여러 번, PC에서도 쓴다)
 * - `hours`: 최근 30일 동안 쓴 시간 → 시간당 금액 (음악·독서 — 한 번 열고 오래 쓴다)
 * - `benefit`: 최근 30일 동안 받은 혜택 금액(원) → 회비 대비 돌려받은 비율 (멤버십)
 * - `storage`: 요금제 용량 중 쓰는 비율(%) (저장 공간 — 줄일 수 있는 요금제인지)
 */
export type ValueMetric = "uses" | "days" | "hours" | "benefit" | "storage";

export const VALUE_METRICS: readonly ValueMetric[] = [
  "uses",
  "days",
  "hours",
  "benefit",
  "storage",
];

export function isValueMetric(value: unknown): value is ValueMetric {
  return typeof value === "string" && (VALUE_METRICS as readonly string[]).includes(value);
}

/**
 * 서비스 목록의 서비스 → 지표. 여기 없는 서비스는 `uses`다.
 *
 * 적지 않은 것: 웹툰 쿠키·이모티콘(사는 것이라 횟수가 맞다), 앱스토어 묶음(무엇인지 모른다), 유튜브를
 * 뺀 OTT.
 */
export const SERVICE_METRICS: Readonly<Record<string, ValueMetric>> = {
  // 프리미엄의 값은 광고 없는 영상과 백그라운드 재생·유튜브 뮤직이다. 연 횟수로는 화면을 끄고 듣는
  // 음악이 빠져서 시간으로 잰다(유튜브 영상 시간 + 유튜브 뮤직 재생 시간).
  "youtube-premium": "hours",
  // 결합 상품은 포함된 영상 서비스의 시간으로 잰다(배민 무료배달의 값은 폰 기록으로 알 수 없다).
  "baemin-youtube-premium": "hours",
  "uplus-double-streaming": "hours",
  spotify: "hours",
  melon: "hours",
  "apple-music": "hours",
  "naver-vibe": "hours",
  millie: "hours",
  "ridi-select": "hours",
  "chatgpt-plus": "days",
  "claude-pro": "days",
  "perplexity-pro": "days",
  "google-ai-pro": "days",
  notion: "days",
  "github-copilot-pro": "days",
  "cursor-pro": "days",
  "adobe-cc": "days",
  "microsoft-365": "days",
  goodnotes: "days",
  "coupang-wow": "benefit",
  "naver-plus": "benefit",
  "baemin-club": "benefit",
  "apple-icloud": "storage",
  "google-one": "storage",
  "naver-mybox": "storage",
};

/**
 * 이 구독을 재는 지표. 서비스 목록에서 찾으면 그 서비스의 것, 못 찾으면 사용자가 고른 분류로 정한다
 * (음악 → 시간, AI → 쓴 날). 그 밖에는 예전처럼 횟수다.
 *
 * 혜택 금액은 원으로 받으므로 원화 구독에만 쓴다 — 달러 회비와 원 혜택을 나누면 뜻 없는 숫자가 된다.
 */
export function metricForSubscription(
  sub: Pick<Subscription, "name" | "cancelUrl" | "category" | "currency">,
): ValueMetric {
  const preset = findPresetForSubscription(sub);
  const metric: ValueMetric =
    (preset && SERVICE_METRICS[preset.id]) ??
    (sub.category === "music" ? "hours" : sub.category === "ai" ? "days" : "uses");
  if (metric === "benefit" && sub.currency !== "KRW") return "uses";
  return metric;
}

/** 기록에 적힌 지표. 적히지 않았으면 이 기능 전의 체크인이라 횟수다. */
export function metricOfLog(log: Pick<UsageLog, "metric">): ValueMetric {
  return log.metric ?? "uses";
}

export interface MetricSpec {
  /** 체크인 질문. */
  question: string;
  /** 질문 아래 한 줄. 무엇을 세는지, 어디서 보는지. */
  hint: string | null;
  /** 입력 칸 옆 단위. */
  unit: string;
  /** 입력할 수 있는 가장 큰 값. */
  max: number;
  /** 빠르게 고를 값. */
  presets: readonly number[];
  /** 수량이 무엇인지 한 마디(체크인 근거 칸의 설명). */
  quantityLabel: string;
  /** 단가 앞말('1회당'). 단가가 뜻이 없는 지표(혜택·용량)는 null. */
  perUnit: string | null;
}

export const METRIC_SPECS: Readonly<Record<ValueMetric, MetricSpec>> = {
  uses: {
    question: "최근 30일 동안 몇 번 썼어요?",
    hint: null,
    unit: "회",
    max: 999,
    presets: [0, 1, 3, 5, 10, 20, 30],
    quantityLabel: "30일 동안 이용한 횟수",
    perUnit: "1회당",
  },
  days: {
    question: "최근 30일 중 며칠 썼어요?",
    hint: "하루에 여러 번 써도 하루예요. 폰·PC 어디서 썼든 세어 주세요.",
    unit: "일",
    max: 30,
    presets: [0, 1, 3, 7, 15, 30],
    quantityLabel: "30일 중 쓴 날",
    perUnit: "하루당",
  },
  hours: {
    question: "최근 30일 동안 몇 시간쯤 썼어요?",
    hint: "화면을 끄고 들은 시간도 넣어 주세요. 하루 30분씩이면 15시간이에요.",
    unit: "시간",
    max: 720,
    presets: [0, 1, 5, 10, 20, 40],
    quantityLabel: "30일 동안 쓴 시간",
    perUnit: "시간당",
  },
  benefit: {
    question: "최근 30일 동안 받은 혜택은 얼마였어요?",
    hint: "무료 배송·할인·적립처럼, 멤버십이 없었으면 냈을 돈을 더해 주세요.",
    unit: "원",
    max: 10_000_000,
    presets: [0, 3000, 5000, 10000, 20000, 50000],
    quantityLabel: "30일 동안 받은 혜택",
    perUnit: null,
  },
  storage: {
    question: "요금제 용량 중 얼마나 쓰고 있어요?",
    hint: "기기 설정의 저장 공간(아이클라우드는 설정 › 내 이름 › iCloud)에서 볼 수 있어요.",
    unit: "%",
    max: 100,
    presets: [0, 10, 25, 50, 75, 100],
    quantityLabel: "요금제 용량 중 쓰는 비율",
    perUnit: null,
  },
};

/** 입력값을 이 지표가 받는 범위의 정수로. */
export function clampQuantity(metric: ValueMetric, value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(METRIC_SPECS[metric].max, Math.max(0, Math.round(value)));
}

/**
 * 색 기준. `uses`는 예전 기준(getRiskLevel) 그대로다. 나머지는 이렇게 정했다 — 숫자가 바뀌면 이 표와
 * 테스트를 함께 고친다.
 *
 * - 쓴 날: 2일 이하 빨강, 10일 이상 초록. 횟수의 1회 이하/8회 이상에 맞춘 값이다.
 * - 쓴 시간: 2시간 미만 빨강, 10시간 이상 초록.
 * - 혜택: 회비의 절반도 못 돌려받으면 빨강, 회비 이상이면(본전) 초록.
 * - 용량: 0%(아무것도 안 둠)만 빨강, 절반 미만은 노랑(더 작은 요금제로 충분할 수 있다), 절반 이상 초록.
 *   적게 써도 해지하라고 하지 않는다 — 사진이 올라가 있으면 끊는 순간 곤란해진다.
 */
export function metricRiskLevel(
  metric: ValueMetric,
  monthlyShare: number,
  quantity: number,
): RiskLevel {
  switch (metric) {
    case "uses":
      return getRiskLevel(calculateCostPerUse(monthlyShare, quantity), monthlyShare, quantity);
    case "days":
      return quantity <= 2 ? "red" : quantity >= 10 ? "green" : "yellow";
    case "hours":
      return quantity < 2 ? "red" : quantity >= 10 ? "green" : "yellow";
    case "benefit": {
      if (monthlyShare <= 0) return "green";
      const ratio = quantity / monthlyShare;
      return ratio < 0.5 ? "red" : ratio >= 1 ? "green" : "yellow";
    }
    case "storage":
      return quantity === 0 ? "red" : quantity < 50 ? "yellow" : "green";
  }
}

export interface MetricEvaluation {
  costPerUse: number;
  riskLevel: RiskLevel;
  shockMessage: string;
}

/** 체크인 하나를 평가한다(스토어의 checkIn이 쓴다). */
export function evaluateMetric(
  metric: ValueMetric,
  serviceName: string,
  monthlyShare: number,
  quantity: number,
  currency: Currency,
): MetricEvaluation {
  const costPerUse = calculateCostPerUse(monthlyShare, quantity);
  return {
    costPerUse,
    riskLevel: metricRiskLevel(metric, monthlyShare, quantity),
    shockMessage: metricMessage(metric, serviceName, monthlyShare, quantity, currency),
  };
}

function metricMessage(
  metric: ValueMetric,
  name: string,
  monthly: number,
  quantity: number,
  currency: Currency,
): string {
  const money = (amount: number) => formatCurrency(amount, currency);
  switch (metric) {
    case "uses":
      return formatShockMessage(name, monthly, quantity, currency);
    case "days":
      return quantity === 0
        ? `최근 30일 동안 ${name}을(를) 하루도 안 썼어요. ${money(monthly)}을 그냥 냈어요.`
        : `${name}을(를) 쓴 날 하루에 ${money(monthly / quantity)}씩 냈어요.`;
    case "hours":
      return quantity === 0
        ? `최근 30일 동안 ${name}을(를) 안 썼어요. ${money(monthly)}을 그냥 냈어요.`
        : `${name} 한 시간에 ${money(monthly / quantity)}씩 냈어요.`;
    case "benefit":
      return quantity >= monthly
        ? `회비 ${money(monthly)}보다 많은 ${money(quantity)}을 혜택으로 돌려받았어요.`
        : `회비 ${money(monthly)} 중 ${money(quantity)}만 혜택으로 돌려받았어요.`;
    case "storage":
      return quantity === 0
        ? `${name}에 아무것도 두지 않았다면 요금제가 필요 없을 수 있어요.`
        : quantity < 50
          ? `${name} 요금제 용량의 ${quantity}%를 쓰고 있어요. 한 단계 작은 요금제로 충분할 수 있어요.`
          : `${name} 요금제 용량의 ${quantity}%를 쓰고 있어요.`;
  }
}

/** 수량만: '12회', '8일', '15시간', '₩12,000', '40%'. 평균처럼 소수가 나올 수 있다. */
export function formatAmountOf(metric: ValueMetric, quantity: number): string {
  const n = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
  return metric === "benefit"
    ? formatCurrency(quantity, "KRW")
    : `${n}${METRIC_SPECS[metric].unit}`;
}

/** '12회 이용', '30일 중 8일', '15시간', '혜택 ₩12,000', '용량의 40%'. */
export function formatQuantity(metric: ValueMetric, quantity: number): string {
  switch (metric) {
    case "uses":
      return `${quantity}회 이용`;
    case "days":
      return `30일 중 ${quantity}일 사용`;
    case "hours":
      return `${quantity}시간 사용`;
    case "benefit":
      return `혜택 ${formatCurrency(quantity, "KRW")}`;
    case "storage":
      return `용량의 ${quantity}% 사용`;
  }
}

/**
 * 수량 옆에 붙는 단가 한 마디. '1회당 ₩3,000', '하루당 ₩1,000', '시간당 ₩500', '회비의 80% 돌려받음'.
 * 용량은 단가가 뜻이 없어 null이다.
 */
export function formatUnitCost(
  metric: ValueMetric,
  costPerUse: number,
  quantity: number,
  currency: Currency,
): string | null {
  switch (metric) {
    case "uses":
      return `1회당 ${formatCurrency(costPerUse, currency)}`;
    case "days":
      return quantity === 0 ? "안 썼어요" : `하루당 ${formatCurrency(costPerUse, currency)}`;
    case "hours":
      return quantity === 0 ? "안 썼어요" : `시간당 ${formatCurrency(costPerUse, currency)}`;
    case "benefit": {
      // costPerUse × quantity가 한 달치 내 몫이다.
      const monthly = quantity === 0 ? costPerUse : costPerUse * quantity;
      if (monthly <= 0) return null;
      return `회비의 ${Math.round((quantity / monthly) * 100)}% 돌려받음`;
    }
    case "storage":
      return null;
  }
}

/** 체크인 기록 한 줄: '12회 이용 · 1회당 ₩3,000'. */
export function describeCheckIn(
  log: Pick<UsageLog, "metric" | "usageCount" | "costPerUse">,
  currency: Currency,
): string {
  const metric = metricOfLog(log);
  const unit = formatUnitCost(metric, log.costPerUse, log.usageCount, currency);
  const quantity = formatQuantity(metric, log.usageCount);
  return unit ? `${quantity} · ${unit}` : quantity;
}

/** 이 구독의 체크인 질문. */
export function checkInQuestion(
  sub: Pick<Subscription, "name" | "cancelUrl" | "category" | "currency">,
): string {
  return METRIC_SPECS[metricForSubscription(sub)].question;
}

/**
 * 표의 단가 칸처럼 좁은 자리의 한 마디. '₩3,000'(1회), '₩1,000/일', '₩500/시간', '80% 환급', '40% 사용'.
 */
export function shortUnitCost(
  log: Pick<UsageLog, "metric" | "usageCount" | "costPerUse">,
  currency: Currency,
): string {
  const metric = metricOfLog(log);
  const money = formatCurrency(log.costPerUse, currency);
  switch (metric) {
    case "uses":
      return money;
    case "days":
      return log.usageCount === 0 ? "안 씀" : `${money}/일`;
    case "hours":
      return log.usageCount === 0 ? "안 씀" : `${money}/시간`;
    case "benefit": {
      const monthly = log.usageCount === 0 ? log.costPerUse : log.costPerUse * log.usageCount;
      return monthly > 0 ? `${Math.round((log.usageCount / monthly) * 100)}% 환급` : "-";
    }
    case "storage":
      return `${log.usageCount}% 사용`;
  }
}
