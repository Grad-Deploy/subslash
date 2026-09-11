/**
 * 절약 공유 링크의 형식.
 *
 * 링크는 남에게 보이는 숫자라 가장 보수적이어야 한다. 새 형식(`v=2`)의
 * `saved`는 결제가 멈춘 것을 확인한 '지킨 돈'이고, 해지를 유지하면 1년에
 * 아끼는 금액은 `annual`에 따로 싣는다.
 *
 * `v`가 없는 예전 링크의 `saved`는 1년치 요금이었다. 이미 퍼진 링크를 새 뜻으로
 * 읽으면 예상액을 지킨 돈으로 보여주게 되므로 형식을 나눠 읽는다.
 *
 * 환산 문구는 싣지 않는다. 공유 페이지가 금액에서 다시 계산하므로, 링크를 고쳐
 * 금액과 다른 말을 인증서에 올릴 수 없다. 이름은 하나씩 따로 실어야 쉼표가 든
 * 이름이 둘로 쪼개지지 않는다.
 */

export const SHARE_FORMAT = "2";

export interface ShareInput {
  /** 결제가 멈춘 것을 확인한 지킨 돈(KRW). */
  confirmed: number;
  /** 해지를 유지하면 1년에 아끼는 금액(KRW). */
  annual: number;
  /** 해지한 구독 수. */
  count: number;
  /** 결제가 멈춘 것을 확인한 해지 수. */
  verifiedCount: number;
  names: string[];
}

export type SharedSavings =
  | {
      format: "confirmed";
      confirmed: number;
      /** 링크에 없거나 숫자가 아니면 null. */
      annual: number | null;
      count: number;
      verifiedCount: number;
      names: string[];
    }
  | {
      /** 예전 링크. 지킨 돈은 담겨 있지 않고 `saved`가 1년치 요금이었다. */
      format: "legacy";
      annual: number;
      count: number;
      names: string[];
    };

type SearchParamsLike = Pick<URLSearchParams, "get" | "getAll">;

export function buildShareSearchParams(input: ShareInput): URLSearchParams {
  const params = new URLSearchParams({
    v: SHARE_FORMAT,
    saved: String(Math.round(input.confirmed)),
    annual: String(Math.round(input.annual)),
    count: String(input.count),
    verified: String(input.verifiedCount),
  });
  input.names.forEach((name) => params.append("name", name));
  return params;
}

/** 링크의 숫자 칸. 숫자가 아니면 "NaN개"를 찍지 않도록 없는 것으로 본다. */
function readCount(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

export function readSharedSavings(params: SearchParamsLike): SharedSavings {
  const count = readCount(params.get("count")) ?? 0;
  // 이름은 `name` 칸에 하나씩 온다. 예전 링크는 `names`에 쉼표로 이어 담았다.
  const listed = params.getAll("name").filter(Boolean);
  const names = listed.length > 0 ? listed : (params.get("names") ?? "").split(",").filter(Boolean);

  if (params.get("v") === SHARE_FORMAT) {
    return {
      format: "confirmed",
      confirmed: readCount(params.get("saved")) ?? 0,
      annual: readCount(params.get("annual")),
      count,
      verifiedCount: readCount(params.get("verified")) ?? 0,
      names,
    };
  }

  return { format: "legacy", annual: readCount(params.get("saved")) ?? 0, count, names };
}
