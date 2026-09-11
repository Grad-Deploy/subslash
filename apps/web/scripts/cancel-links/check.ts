import { PAYMENT_METHOD_OPTIONS, POPULAR_SERVICES } from "@subslash/shared";

/**
 * 해지 링크 점검 — 프리셋과 결제 수단에 적어 둔 해지 링크가 아직 살아 있는지
 * 로그인 없이 요청을 보내 확인한다.
 *
 * 이 점검이 아는 것은 "서버가 그 주소에 무엇을 돌려줬는가"뿐이다. 로그인 뒤
 * 화면에 해지 버튼이 있는지는 모른다. 그래서 결과를 살았다/죽었다 둘로 나누지
 * 않고, 판별하지 못한 경우를 따로 둔다. 링크를 자동으로 고치지도 않는다 —
 * 사람이 열어 보고 services.ts를 고친다.
 */

export type LinkKind = "direct" | "entry";

export interface CancelLink {
  url: string;
  /**
   * direct는 해지 화면 경로 자체가 살아 있어야 하고, entry는 그 서비스
   * 사이트에 들어가지기만 하면 된다.
   */
  kind: LinkKind;
  /** 이 링크를 쓰는 곳 (프리셋·결제 수단 이름) */
  usedBy: string[];
}

export type Verdict = "ok" | "login" | "unverified" | "unreachable" | "moved" | "broken";

export interface LinkResult {
  link: CancelLink;
  verdict: Verdict;
  /** 사람이 읽을 한 줄 설명 */
  reason: string;
  /** 마지막으로 도착한 주소. 요청한 주소와 같으면 없다. */
  finalUrl?: string;
}

/** 사람이 링크를 고쳐야 할 수 있는 결과. 이것이 있을 때만 이슈를 연다. */
export const NEEDS_REVIEW: ReadonlySet<Verdict> = new Set<Verdict>(["broken", "moved"]);

export function collectCancelLinks(): CancelLink[] {
  const links = new Map<string, CancelLink>();
  const add = (url: string, kind: LinkKind, name: string) => {
    const existing = links.get(url);
    if (!existing) {
      links.set(url, { url, kind, usedBy: [name] });
      return;
    }
    existing.usedBy.push(name);
    // 한 곳이라도 이 주소를 해지 화면이라고 약속했다면 그 기준으로 본다.
    if (kind === "direct") existing.kind = "direct";
  };

  for (const service of POPULAR_SERVICES) {
    add(service.cancelUrl, service.cancelUrlKind, service.nameKo);
  }
  for (const method of PAYMENT_METHOD_OPTIONS) {
    if (!method.directCancelUrl) continue;
    // 결제 수단 링크에는 성격이 적혀 있지 않다. 첫 화면이면 entry로, 경로가
    // 있으면 그 경로를 약속한 것으로 본다.
    const kind = isBareOrigin(method.directCancelUrl) ? "entry" : "direct";
    add(method.directCancelUrl, kind, method.label);
  }
  return [...links.values()];
}

// ---------------------------------------------------------------------------
// 요청

export interface Hop {
  url: string;
  status: number;
}

export interface Trace {
  hops: Hop[];
  /** 최종 응답을 받지 못한 이유. 있으면 hops의 마지막은 최종 응답이 아니다. */
  error?: { kind: "dns" | "timeout" | "network" | "loop"; message: string };
}

const MAX_HOPS = 10;
const TIMEOUT_MS = 15_000;

const REQUEST_HEADERS = {
  // 브라우저가 아닌 요청을 곧바로 막는 사이트가 많아 브라우저 UA를 쓰되,
  // 누가 보낸 요청인지는 끝에 밝힌다.
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/128.0.0.0 Safari/537.36 SubSlashLinkCheck/1.0",
  accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
};

/** 리다이렉트를 한 단계씩 따라가며 거친 주소와 상태 코드를 남긴다. */
export async function traceUrl(url: string, fetchImpl: typeof fetch = fetch): Promise<Trace> {
  const hops: Hop[] = [];
  const jar = new CookieJar();
  let current = url;

  for (let i = 0; i < MAX_HOPS; i++) {
    let res: Response;
    try {
      res = await fetchImpl(current, {
        redirect: "manual",
        headers: { ...REQUEST_HEADERS, ...jar.headerFor(current) },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      return { hops, error: describeFetchError(err) };
    }
    // 본문은 쓰지 않는다. 받지 않고 닫아야 연결이 남지 않는다.
    await res.body?.cancel().catch(() => {});
    hops.push({ url: current, status: res.status });
    jar.store(current, res.headers);

    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) return { hops };
    try {
      current = new URL(location, current).href;
    } catch {
      return { hops, error: { kind: "network", message: `해석할 수 없는 리다이렉트 주소` } };
    }
  }
  return { hops, error: { kind: "loop", message: `리다이렉트가 ${MAX_HOPS}번 넘게 이어짐` } };
}

function describeFetchError(err: unknown): NonNullable<Trace["error"]> {
  const name = (err as { name?: string } | null)?.name;
  if (name === "TimeoutError" || name === "AbortError") {
    return { kind: "timeout", message: `${TIMEOUT_MS / 1000}초 안에 응답 없음` };
  }
  const code = (err as { cause?: { code?: string } } | null)?.cause?.code;
  if (code === "ENOTFOUND") return { kind: "dns", message: "도메인을 찾을 수 없음" };
  return { kind: "network", message: `연결 실패 (${code ?? String(err)})` };
}

/**
 * 리다이렉트 사이에 쿠키를 들고 다니는 최소한의 저장소. 쿠키를 심은 뒤
 * 다시 보내는지 보는 사이트는, 쿠키가 없으면 같은 곳으로 계속 돌려보낸다.
 * 경로·만료는 보지 않는다 — 한 번의 점검 동안만 쓴다.
 */
class CookieJar {
  private cookies = new Map<string, Map<string, string>>();

  store(url: string, headers: Headers) {
    const host = new URL(url).hostname;
    for (const line of headers.getSetCookie()) {
      const [pair, ...attributes] = line.split(";");
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const domainAttribute = attributes
        .map((attribute) => attribute.trim())
        .find((attribute) => attribute.toLowerCase().startsWith("domain="));
      const domain = domainAttribute
        ? domainAttribute.slice("domain=".length).replace(/^\./, "").toLowerCase()
        : host;
      // 브라우저처럼, 응답한 호스트와 무관한 도메인의 쿠키는 받지 않는다.
      if (!isSameOrSubdomain(host, domain)) continue;
      const entries = this.cookies.get(domain) ?? new Map<string, string>();
      entries.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      this.cookies.set(domain, entries);
    }
  }

  headerFor(url: string): Record<string, string> {
    const host = new URL(url).hostname;
    const pairs: string[] = [];
    for (const [domain, entries] of this.cookies) {
      if (!isSameOrSubdomain(host, domain)) continue;
      for (const [name, value] of entries) pairs.push(`${name}=${value}`);
    }
    return pairs.length > 0 ? { cookie: pairs.join("; ") } : {};
  }
}

function isSameOrSubdomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

// ---------------------------------------------------------------------------
// 판정

/** 없을 법한 경로. 이 주소에도 200을 주는 사이트는 경로의 존재를 알려주지 않는다. */
export const PROBE_PATH_PREFIX = "/subslash-link-check-";

export async function checkLink(
  link: CancelLink,
  fetchImpl: typeof fetch = fetch,
): Promise<LinkResult> {
  let trace = await traceUrl(link.url, fetchImpl);
  // DNS 일시 오류(EAI_AGAIN)나 끊긴 연결은 한 번 더 해 본다. 한 번의 실패로
  // 판정하면 매달 다른 링크가 "확인 불가"로 올라온다.
  if (trace.error && trace.error.kind !== "loop") trace = await traceUrl(link.url, fetchImpl);

  const result = classifyTrace(link, trace);
  if (result.verdict !== "ok" || link.kind !== "direct") return result;

  // 대부분의 SPA는 없는 주소에도 같은 첫 화면을 200으로 준다. 그런 사이트에서는
  // 해지 경로의 200이 그 경로가 있다는 증거가 되지 못한다.
  const probeUrl = `${new URL(link.url).origin}${PROBE_PATH_PREFIX}${Date.now().toString(36)}`;
  if (rejectsMissingPaths(await traceUrl(probeUrl, fetchImpl))) return result;
  return {
    ...result,
    verdict: "unverified",
    reason: "열리지만, 없는 주소에도 같은 응답을 줘서 이 경로가 살아 있는지는 알 수 없음",
  };
}

export function classifyTrace(link: CancelLink, trace: Trace): LinkResult {
  const last = trace.hops.at(-1);
  const finalUrl = last && last.url !== link.url ? last.url : undefined;

  if (trace.error) {
    const verdict = trace.error.kind === "dns" ? "broken" : "unreachable";
    return { link, verdict, reason: trace.error.message, finalUrl };
  }
  if (!last) return { link, verdict: "unreachable", reason: "응답 없음" };

  if (last.status === 401 || (finalUrl && last.status < 400 && isLoginUrl(last.url))) {
    return {
      link,
      verdict: "login",
      reason: "로그인 뒤 도착하는 곳은 확인 못함",
      finalUrl,
    };
  }
  if (last.status === 404 || last.status === 410) {
    return { link, verdict: "broken", reason: `${last.status} 응답`, finalUrl };
  }
  if (last.status >= 400) {
    return {
      link,
      verdict: "unreachable",
      reason: `${last.status} 응답 — 봇 차단·지역 제한이거나 일시적인 오류일 수 있음`,
      finalUrl,
    };
  }
  if (last.status >= 300) {
    return {
      link,
      verdict: "unreachable",
      reason: `이동할 곳이 없는 리다이렉트 (${last.status})`,
      finalUrl,
    };
  }

  if (!isSameSite(link.url, last.url)) {
    return { link, verdict: "moved", reason: "다른 사이트로 옮겨감", finalUrl };
  }
  if (link.kind === "direct" && !keepsPath(link.url, last.url)) {
    const landedOnHome = normalizedPath(last.url) === "";
    return {
      link,
      verdict: "moved",
      reason: landedOnHome
        ? "첫 화면으로 돌아감 — 해지 경로가 없어졌을 수 있음"
        : "다른 경로로 옮겨감",
      finalUrl,
    };
  }
  const reason = link.kind === "direct" ? "해지 경로에 페이지가 있음" : "사이트가 열림";
  return { link, verdict: "ok", reason, finalUrl };
}

/** 없을 법한 경로를 요청했을 때, 사이트가 "없다"는 신호를 줬는가. */
function rejectsMissingPaths(probe: Trace): boolean {
  if (probe.error) return false;
  const last = probe.hops.at(-1);
  if (!last) return false;
  if (last.status === 404 || last.status === 410) return true;
  // 다른 곳(404 페이지, 첫 화면 등)으로 보냈다면 그 경로를 따로 취급한 것이다.
  return !new URL(last.url).pathname.startsWith(PROBE_PATH_PREFIX);
}

function isLoginUrl(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  return (
    /^(login|signin|auth|accounts|idmsa|appleid)\./i.test(hostname) ||
    /(^|\/)(login|log-in|signin|sign-in|sign_in|nidlogin[^/]*|sso)(\/|\.|$)/i.test(pathname)
  );
}

/** www.·m. 차이는 같은 사이트로 본다. */
function isSameSite(a: string, b: string): boolean {
  const base = (url: string) => new URL(url).hostname.replace(/^(www|m)\./, "");
  return base(a) === base(b);
}

/**
 * 도착한 경로가 요청한 경로를 유지하는가. `/kr/cancelplan`처럼 앞에 언어
 * 경로가 붙는 것은 같은 화면으로 본다.
 */
function keepsPath(requested: string, landed: string): boolean {
  return normalizedPath(landed).endsWith(normalizedPath(requested));
}

function normalizedPath(url: string): string {
  return new URL(url).pathname.replace(/\/+$/, "").toLowerCase();
}

function isBareOrigin(url: string): boolean {
  const parsed = new URL(url);
  return parsed.pathname === "/" && !parsed.search;
}

export async function checkCancelLinks(
  links: CancelLink[],
  options: {
    fetchImpl?: typeof fetch;
    concurrency?: number;
    onResult?: (result: LinkResult) => void;
  } = {},
): Promise<LinkResult[]> {
  const { fetchImpl = fetch, concurrency = 4, onResult } = options;
  const results: LinkResult[] = new Array(links.length);
  let next = 0;
  const worker = async () => {
    while (next < links.length) {
      const index = next++;
      results[index] = await checkLink(links[index], fetchImpl);
      onResult?.(results[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, links.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// 보고서

const VERDICT_LABEL: Record<Verdict, string> = {
  broken: "없는 주소",
  moved: "옮겨짐",
  unreachable: "자동 확인 불가",
  unverified: "경로 확인 불가",
  login: "로그인 화면으로 이동",
  ok: "열림",
};

export function renderReport(results: LinkResult[], checkedAt: Date): string {
  const review = results.filter((result) => NEEDS_REVIEW.has(result.verdict));
  const unknown = results.filter(
    (result) => result.verdict === "unreachable" || result.verdict === "unverified",
  );
  const fine = results.filter((result) => result.verdict === "ok" || result.verdict === "login");

  const lines = [
    `## 해지 링크 점검 (${checkedAt.toISOString().slice(0, 10)})`,
    "",
    `링크 ${results.length}개 중 확인 필요 ${review.length}개, 자동으로 확인하지 못함 ${unknown.length}개.`,
    "",
    '로그인하지 않은 상태로 요청을 보낸 결과입니다. "열림"은 서버가 그 주소에 페이지를 ' +
      "줬다는 뜻일 뿐, 그 화면에 해지 버튼이 있다는 뜻은 아닙니다. 해외 서버에서 실행하면 " +
      "국내 서비스가 요청을 막을 수 있습니다.",
    "",
    "링크는 자동으로 고치지 않습니다. 직접 열어 보고 " +
      "`packages/shared/src/constants/services.ts`를 고쳐 주세요.",
  ];

  lines.push("", `### 확인 필요 (${review.length})`, "");
  lines.push(...(review.length > 0 ? renderTable(review) : ["없음"]));
  lines.push("", `### 자동으로 확인하지 못함 (${unknown.length})`, "");
  lines.push(...(unknown.length > 0 ? renderTable(unknown) : ["없음"]));
  if (fine.length > 0) {
    lines.push(
      "",
      "<details>",
      `<summary>문제 없어 보임 (${fine.length})</summary>`,
      "",
      ...renderTable(fine),
      "",
      "</details>",
    );
  }
  return `${lines.join("\n")}\n`;
}

function renderTable(results: LinkResult[]): string[] {
  const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    "| 쓰는 곳 | 링크 | 결과 |",
    "| --- | --- | --- |",
    ...results.map((result) => {
      const outcome = [`**${VERDICT_LABEL[result.verdict]}** — ${result.reason}`];
      if (result.finalUrl) outcome.push(`도착: ${displayUrl(result.finalUrl)}`);
      return `| ${cell(result.link.usedBy.join(", "))} | ${cell(result.link.url)} | ${cell(outcome.join("<br>"))} |`;
    }),
  ];
}

/** 로그인 화면 주소는 쿼리만 수백 자다. 사람이 볼 부분만 남긴다. */
function displayUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}${parsed.search ? "?…" : ""}`;
}
