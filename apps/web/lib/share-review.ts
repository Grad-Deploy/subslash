import {
  CATEGORY_LABELS,
  FOCUSED_SHARE,
  type SpendingType,
  type SubscriptionCategory,
} from "@subslash/shared";

/**
 * 연말 결산 공유 링크의 형식.
 *
 * 절약 인증서(`share-savings.ts`)와 같은 원칙이다. 링크는 남에게 보이는 숫자라
 * 숫자와 정해진 값만 싣는다. 소비 유형은 이름이 아니라 카테고리 키와 비율로 싣고,
 * 유형 이름은 공유 페이지가 다시 만든다 — 링크를 고쳐 아무 말이나 카드에 올릴 수
 * 없게. 알 수 없는 값은 버리고, 연도부터 틀린 링크는 통째로 받지 않는다.
 */

export const REVIEW_SHARE_FORMAT = "1";

/** 이보다 이른 해는 이 앱에 기록이 있을 수 없다. 결산 화면과 같은 값. */
const EARLIEST_YEAR = 2020;
/** 링크가 끝없이 길어지지 않게 해지한 서비스 이름은 이만큼만 싣는다. */
export const MAX_SHARED_NAMES = 10;

export interface ReviewShareInput {
  year: number;
  isComplete: boolean;
  /** 해지로 막은 결제(결제일 기준). */
  blocked: number;
  /** 그중 결제가 멈춘 것을 확인한 지킨 돈. */
  confirmed: number;
  killedCount: number;
  names: string[];
  spendingType: SpendingType | null;
}

export interface SharedReview {
  year: number;
  isComplete: boolean;
  blocked: number;
  confirmed: number;
  killedCount: number;
  names: string[];
  spendingType: SpendingType | null;
}

type SearchParamsLike = Pick<URLSearchParams, "get" | "getAll">;

export function buildReviewShareSearchParams(input: ReviewShareInput): URLSearchParams {
  const params = new URLSearchParams({
    v: REVIEW_SHARE_FORMAT,
    y: String(input.year),
    done: input.isComplete ? "1" : "0",
    blocked: String(Math.round(input.blocked)),
    saved: String(Math.round(input.confirmed)),
    killed: String(input.killedCount),
  });
  input.names.slice(0, MAX_SHARED_NAMES).forEach((name) => params.append("name", name));

  const type = input.spendingType;
  if (type?.kind === "focused") {
    params.set("type", "focused");
    params.set("cat", type.category);
    params.set("pct", String(Math.round(type.share * 100)));
  } else if (type?.kind === "spread") {
    params.set("type", "spread");
    params.set("cats", String(type.categoryCount));
  }
  return params;
}

/** 링크의 숫자 칸. 음이 아닌 수가 아니면 없는 것으로 본다. */
function readCount(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

function isCategory(value: string | null): value is SubscriptionCategory {
  // `in`은 toString 같은 상속 속성까지 참으로 본다.
  return value !== null && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value);
}

function readSpendingType(params: SearchParamsLike): SpendingType | null {
  const type = params.get("type");
  if (type === "focused") {
    const category = params.get("cat");
    const pct = readCount(params.get("pct"));
    if (!isCategory(category) || pct === null || pct < FOCUSED_SHARE * 100 || pct > 100) {
      return null;
    }
    return { kind: "focused", category, share: pct / 100 };
  }
  if (type === "spread") {
    const count = readCount(params.get("cats"));
    const max = Object.keys(CATEGORY_LABELS).length;
    // 분산형은 두 분야 이상이어야 한다. 한 분야면 그 분야가 100%인 집중형이다.
    if (count === null || count < 2 || count > max) return null;
    return { kind: "spread", categoryCount: count };
  }
  return null;
}

/** 링크를 읽는다. 형식이나 연도가 틀리면 null — 숫자를 짐작해 채우지 않는다. */
export function readSharedReview(
  params: SearchParamsLike,
  now: Date = new Date(),
): SharedReview | null {
  if (params.get("v") !== REVIEW_SHARE_FORMAT) return null;
  const year = readCount(params.get("y"));
  if (year === null || year < EARLIEST_YEAR || year > now.getFullYear()) return null;

  return {
    year,
    // 올해를 '한 해 결산'이라고 부를 수는 없다. 끝났다고 적힌 링크라도 그 해가
    // 아직 끝나지 않았으면 "지금까지"로 읽는다.
    isComplete: params.get("done") === "1" && year < now.getFullYear(),
    blocked: readCount(params.get("blocked")) ?? 0,
    confirmed: readCount(params.get("saved")) ?? 0,
    killedCount: readCount(params.get("killed")) ?? 0,
    names: params.getAll("name").filter(Boolean).slice(0, MAX_SHARED_NAMES),
    spendingType: readSpendingType(params),
  };
}
