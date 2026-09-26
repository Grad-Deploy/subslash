import {
  POPULAR_SERVICES,
  daysSinceReceipt,
  getBilledAmount,
  isStaleReceipt,
  type BillingCycle,
  type Currency,
  type DiscoveredSubscription,
  type PaymentMethod,
  type Subscription,
  type SubscriptionCategory,
  type SubscriptionFormData,
  coveredServices,
} from "@subslash/shared";
import { apiFetch, readApiError } from "./api";

/**
 * Gmail 자동 가져오기의 브라우저 쪽.
 *
 * 서버는 사용자의 Apps Script가 보낸 결제 메일에서 찾은 구독 후보만 들고 있다. 구독 기록은
 * 브라우저에 있으므로, 로그인한 브라우저가 후보를 받아 스스로 등록하고 받은 후보를 지운다.
 */

/** 서버가 돌려주는 후보(`lib/gmail-auto-import`의 DiscoveryDto). */
export interface GmailDiscovery {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingDay: number;
  billingCycle: BillingCycle;
  billingMonth: number | null;
  category: string;
  presetId: string | null;
  paymentMethod: string | null;
  receiptDate: string;
  sender: string;
  tier: "auto" | "review";
}

export type GmailLinkState =
  | { open: false }
  | { open: true; linked: false; connectAvailable: boolean }
  | {
      open: true;
      linked: true;
      /** 운영자가 원클릭 연결 웹 앱을 설정했는지. */
      connectAvailable: boolean;
      createdAt: string;
      lastIngestAt: string | null;
      lastEmailCount: number | null;
      pendingCount: number;
    };

export async function fetchGmailLink(): Promise<GmailLinkState> {
  const response = await apiFetch("/api/gmail/link");
  if (!response.ok) throw new Error(await readApiError(response, "연결 상태를 읽지 못했습니다."));
  return (await response.json()) as GmailLinkState;
}

/** 연결 토큰을 새로 받는다. 이미 연결돼 있었다면 예전 스크립트는 끊긴다. */
export async function createGmailLink(): Promise<string> {
  const response = await apiFetch("/api/gmail/link", {
    method: "POST",
  });
  if (!response.ok) throw new Error(await readApiError(response, "연결 토큰을 만들지 못했습니다."));
  return ((await response.json()) as { token: string }).token;
}

/**
 * 원클릭 연결을 시작한다. 돌려받은 주소(SubSlash의 Apps Script 웹 앱)로 가면 Google이 권한을 묻고,
 * 허용하면 웹 앱이 이 계정의 연결을 새로 발급한다 — 예전 스크립트는 그때부터 거절된다.
 */
export async function startGmailConnect(): Promise<string> {
  const response = await apiFetch("/api/gmail/connect", {
    method: "POST",
  });
  if (!response.ok)
    throw new Error(await readApiError(response, "Gmail 연결을 시작하지 못했습니다."));
  return ((await response.json()) as { url: string }).url;
}

export async function deleteGmailLink(): Promise<void> {
  const response = await apiFetch("/api/gmail/link", {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await readApiError(response, "연결을 끊지 못했습니다."));
}

const DISCOVERIES_REQUESTED = "subslash:gmail-discoveries-requested";

/**
 * 찾아 둔 구독을 지금 받아 오라고 알린다. Gmail 연결 화면에서 돌아왔을 때 부른다.
 *
 * 웹은 Google 권한 화면에서 돌아오면 페이지가 새로 열려 `GmailDiscoveryInbox`가 처음부터 받는다.
 * 앱은 인앱 브라우저를 닫아도 화면이 그대로라, 알리지 않으면 앱을 껐다 켤 때까지 받지 않는다.
 */
export function requestGmailDiscoveries(): void {
  window.dispatchEvent(new Event(DISCOVERIES_REQUESTED));
}

/**
 * 연결 화면에서 돌아왔을 때. 웹 앱은 최근 메일만 보고 화면을 돌려준 뒤, 1분쯤 지나 나머지 1년 치(연간
 * 결제)를 이어서 보낸다(scanOlder). 그래서 지금 한 번 받고, 이어서 올 것을 90초·3분 뒤에 다시 받는다.
 */
export function requestGmailDiscoveriesAfterConnect(): void {
  requestGmailDiscoveries();
  for (const delay of [90_000, 180_000]) window.setTimeout(requestGmailDiscoveries, delay);
}

/** `requestGmailDiscoveries`를 듣는다. 듣기를 멈추는 함수를 돌려준다. */
export function onGmailDiscoveriesRequested(listener: () => void): () => void {
  window.addEventListener(DISCOVERIES_REQUESTED, listener);
  return () => window.removeEventListener(DISCOVERIES_REQUESTED, listener);
}

export async function fetchGmailDiscoveries(): Promise<GmailDiscovery[]> {
  const response = await apiFetch("/api/gmail/discoveries");
  if (!response.ok)
    throw new Error(await readApiError(response, "찾아 둔 구독을 읽지 못했습니다."));
  return ((await response.json()) as { discoveries: GmailDiscovery[] }).discoveries;
}

/** 받은(등록했거나 버린) 후보를 서버에서 지운다. */
export async function acknowledgeGmailDiscoveries(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const response = await apiFetch("/api/gmail/discoveries", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok)
    throw new Error(await readApiError(response, "찾아 둔 구독을 지우지 못했습니다."));
}

function sameService(
  a: { name: string; currency: Currency },
  b: { name: string; currency: Currency },
) {
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && a.currency === b.currency;
}

export interface DiscoveryPlan {
  /** 확인 없이 등록할 후보. */
  register: GmailDiscovery[];
  /** 사용자가 골라야 하는 후보. */
  review: GmailDiscovery[];
  /** 이미 구독 중이라 등록하지 않고 지울 후보. */
  alreadyTracked: GmailDiscovery[];
  /**
   * 해지로 기록한 구독인데 그 뒤에 결제 메일이 온 것. 해지가 안 됐다는 증거라, 되살리지 않고
   * 그 구독에 사실만 적어 행동 큐가 알리게 한다.
   */
  chargedAfterKill: { subscriptionId: string; discovery: GmailDiscovery }[];
  /**
   * 구독 중인데 결제 메일의 금액이 등록된 청구액과 다른 것. 요금이 바뀌었을 수도, 등록한 금액이
   * 틀렸을 수도 있다 — 앱은 어느 쪽인지 모르므로 사실만 적어 두고 사용자가 판단하게 한다.
   */
  amountChanged: { subscriptionId: string; discovery: GmailDiscovery }[];
}

/**
 * 받은 후보를 나눈다.
 *
 * 같은 서비스(이름·통화)를 이미 구독 중이면 다음 달 영수증일 뿐이라 등록하지 않는다. 해지로
 * 기록한 서비스의 결제 메일이 왔다면 해지가 안 됐을 수 있으니, 자동으로 되살리지 않고 확인
 * 목록에 둔다.
 */
/**
 * 영수증 금액이 등록된 청구액과 다른지.
 *
 * 영수증에 찍힌 값은 카드에 청구된 금액이므로 `amount`(요금표 가격)가 아니라
 * `getBilledAmount`(세금 포함)와 비교한다. 결제 주기가 다르면 비교하지 않는다 — 연 결제
 * 영수증을 월 요금과 견주면 늘 다르다고 나온다. 원 단위 미만 차이는 반올림으로 본다.
 */
function chargedDifferently(sub: Subscription, discovery: GmailDiscovery): boolean {
  if (sub.billingCycle !== discovery.billingCycle) return false;
  if (!(discovery.amount > 0)) return false;
  return Math.abs(getBilledAmount(sub) - discovery.amount) >= 1;
}

export function planDiscoveries(
  discoveries: GmailDiscovery[],
  subscriptions: Subscription[],
): DiscoveryPlan {
  const plan: DiscoveryPlan = {
    register: [],
    review: [],
    alreadyTracked: [],
    chargedAfterKill: [],
    amountChanged: [],
  };
  for (const discovery of discoveries) {
    const matches = subscriptions.filter((sub) => sameService(sub, discovery));
    const active = matches.find((sub) => sub.status === "active");
    if (active) {
      plan.alreadyTracked.push(discovery);
      if (chargedDifferently(active, discovery)) {
        plan.amountChanged.push({ subscriptionId: active.id, discovery });
      }
      continue;
    }

    // 해지로 기록해 둔 서비스의 결제 메일이다. 결제가 멈추지 않았다는 뜻이므로, 그 구독에
    // 사실을 적어 둔다. 확인 목록에도 함께 올려 사용자가 되살릴지 고를 수 있게 한다.
    const killed = matches.find((sub) => sub.status === "killed");
    if (killed) {
      plan.chargedAfterKill.push({ subscriptionId: killed.id, discovery });
    }

    // 결합 상품으로 이미 받는 서비스의 영수증이다(배민클럽 + 유튜브 프리미엄을 쓰는데 유튜브 프리미엄
    // 영수증이 왔다). 두 번 내고 있다는 증거일 수 있어 조용히 등록하지 않고 확인 목록에 둔다.
    // 자기 자신(같은 서비스)은 위에서 걸렀다. 결합 상품이 '포함'하는 서비스만 본다.
    const coveredByBundle =
      discovery.presetId !== null &&
      subscriptions.some(
        (sub) =>
          sub.status === "active" &&
          coveredServices(sub)
            .slice(1)
            .includes(discovery.presetId as string),
      );

    if (discovery.tier === "auto" && matches.length === 0 && !coveredByBundle) {
      plan.register.push(discovery);
    } else {
      plan.review.push(discovery);
    }
  }
  return plan;
}

/**
 * 후보를 구독으로. 해지 링크·안내는 서비스 목록에서 가져온다. 세율(`taxRate`)은 채우지 않는다 —
 * 메일의 금액은 이미 카드에 청구된 금액이라, 세율을 더하면 세금이 두 번 붙는다.
 */
export function discoveryToFormData(discovery: GmailDiscovery): SubscriptionFormData {
  const preset = POPULAR_SERVICES.find((service) => service.id === discovery.presetId);
  return {
    name: discovery.name,
    amount: discovery.amount,
    currency: discovery.currency,
    billingDay: discovery.billingDay,
    billingCycle: discovery.billingCycle,
    billingMonth: discovery.billingMonth ?? undefined,
    category: discovery.category as SubscriptionCategory,
    cancelUrl: preset?.cancelUrl,
    cancelGuide: preset?.cancelGuide,
    paymentMethod: (discovery.paymentMethod as PaymentMethod | null) ?? undefined,
  };
}

/**
 * 확인 목록에 띄울 모양으로. 가져오기 창이 이 모양을 받는다.
 *
 * 왜 확인이 필요한지를 후보마다 적는다. 셋은 서로 다른 말이라 뭉뚱그리지 않는다 — 해지한
 * 서비스에 결제 메일이 온 것은 증거이고, 마지막 결제 메일이 오래된 것은 모른다는 뜻이며,
 * 이름을 찾지 못한 것은 어느 서비스인지 모른다는 뜻이다. 앞의 둘은 체크를 풀어 두어 사용자가
 * 직접 고르게 한다.
 */
export function discoveryToCandidate(
  discovery: GmailDiscovery,
  subscriptions: Subscription[],
  now = new Date(),
): DiscoveredSubscription {
  const form = discoveryToFormData(discovery);
  const killed = subscriptions.some(
    (sub) => sub.status === "killed" && sameService(sub, discovery),
  );
  const daysAgo = daysSinceReceipt(discovery.receiptDate, now);
  const stale = isStaleReceipt(discovery.receiptDate, discovery.billingCycle, now);

  return {
    ...form,
    id: discovery.id,
    source: "gmail",
    emailProvider: "google",
    presetId: discovery.presetId ?? undefined,
    sender: discovery.sender,
    sourceSnippet: `${discovery.receiptDate} · ${discovery.sender}`,
    receiptDate: discovery.receiptDate,
    daysAgo: daysAgo ?? undefined,
    confidence: discovery.presetId ? "high" : "medium",
    selected: !killed && !stale,
    isWithin30Days: !stale,
    statusReason: killed
      ? "해지로 기록한 서비스인데 결제 메일이 왔습니다. 해지가 됐는지 확인해 주세요"
      : stale
        ? `마지막 결제 메일이 ${daysAgo}일 전이라 지금도 결제 중인지 알 수 없습니다`
        : "결제 메일에서 찾았지만 어떤 서비스인지 확실하지 않습니다",
  };
}
