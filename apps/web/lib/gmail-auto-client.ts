import {
  POPULAR_SERVICES,
  type BillingCycle,
  type Currency,
  type DiscoveredSubscription,
  type PaymentMethod,
  type Subscription,
  type SubscriptionCategory,
  type SubscriptionFormData,
} from "@subslash/shared";
import { apiUrl } from "./api";

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

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchGmailLink(): Promise<GmailLinkState> {
  const response = await fetch(apiUrl("/api/gmail/link"), { credentials: "same-origin" });
  if (!response.ok) throw new Error(await readError(response, "연결 상태를 읽지 못했습니다."));
  return (await response.json()) as GmailLinkState;
}

/** 연결 토큰을 새로 받는다. 이미 연결돼 있었다면 예전 스크립트는 끊긴다. */
export async function createGmailLink(): Promise<string> {
  const response = await fetch(apiUrl("/api/gmail/link"), {
    method: "POST",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response, "연결 토큰을 만들지 못했습니다."));
  return ((await response.json()) as { token: string }).token;
}

/**
 * 원클릭 연결을 시작한다. 돌려받은 주소(SubSlash의 Apps Script 웹 앱)로 가면 Google이 권한을 묻고,
 * 허용하면 웹 앱이 이 계정의 연결을 새로 발급한다 — 예전 스크립트는 그때부터 거절된다.
 */
export async function startGmailConnect(): Promise<string> {
  const response = await fetch(apiUrl("/api/gmail/connect"), {
    method: "POST",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response, "Gmail 연결을 시작하지 못했습니다."));
  return ((await response.json()) as { url: string }).url;
}

export async function deleteGmailLink(): Promise<void> {
  const response = await fetch(apiUrl("/api/gmail/link"), {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response, "연결을 끊지 못했습니다."));
}

export async function fetchGmailDiscoveries(): Promise<GmailDiscovery[]> {
  const response = await fetch(apiUrl("/api/gmail/discoveries"), { credentials: "same-origin" });
  if (!response.ok) throw new Error(await readError(response, "찾아 둔 구독을 읽지 못했습니다."));
  return ((await response.json()) as { discoveries: GmailDiscovery[] }).discoveries;
}

/** 받은(등록했거나 버린) 후보를 서버에서 지운다. */
export async function acknowledgeGmailDiscoveries(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const response = await fetch(apiUrl("/api/gmail/discoveries"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) throw new Error(await readError(response, "찾아 둔 구독을 지우지 못했습니다."));
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
}

/**
 * 받은 후보를 나눈다.
 *
 * 같은 서비스(이름·통화)를 이미 구독 중이면 다음 달 영수증일 뿐이라 등록하지 않는다. 해지로
 * 기록한 서비스의 결제 메일이 왔다면 해지가 안 됐을 수 있으니, 자동으로 되살리지 않고 확인
 * 목록에 둔다.
 */
export function planDiscoveries(
  discoveries: GmailDiscovery[],
  subscriptions: Subscription[],
): DiscoveryPlan {
  const plan: DiscoveryPlan = { register: [], review: [], alreadyTracked: [] };
  for (const discovery of discoveries) {
    const matches = subscriptions.filter((sub) => sameService(sub, discovery));
    if (matches.some((sub) => sub.status === "active")) {
      plan.alreadyTracked.push(discovery);
    } else if (discovery.tier === "auto" && matches.length === 0) {
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

/** 확인 목록에 띄울 모양으로. 가져오기 창이 이 모양을 받는다. */
export function discoveryToCandidate(
  discovery: GmailDiscovery,
  subscriptions: Subscription[],
): DiscoveredSubscription {
  const form = discoveryToFormData(discovery);
  const killed = subscriptions.some(
    (sub) => sub.status === "killed" && sameService(sub, discovery),
  );
  return {
    ...form,
    id: discovery.id,
    source: "gmail",
    emailProvider: "google",
    presetId: discovery.presetId ?? undefined,
    sender: discovery.sender,
    sourceSnippet: `${discovery.receiptDate} · ${discovery.sender}`,
    receiptDate: discovery.receiptDate,
    confidence: discovery.presetId ? "high" : "medium",
    selected: !killed,
    isWithin30Days: true,
    statusReason: killed
      ? "해지로 기록한 서비스인데 결제 메일이 왔습니다. 해지가 됐는지 확인해 주세요"
      : "결제 메일에서 찾았지만 어떤 서비스인지 확실하지 않습니다",
  };
}
