import { Resolver } from "node:dns/promises";

/**
 * 이메일 도메인이 실제로 메일을 받을 수 있는지 DNS에 물어본다.
 *
 * 형식 검사(`validateEmail`)만으로는 `sean@gmial-typo.com`처럼 없는 도메인도
 * 통과한다. 여기서는 그 도메인에 메일 서버가 있는지 확인한다.
 *
 * 알 수 있는 것은 "이 도메인으로 메일이 갈 수 있다"까지다. 존재하는 도메인에
 * 잘못 적은 주소(gmail.com인데 아이디 오타 등)는 걸러지지 않고, 주소가 가입하는
 * 사람의 것인지는 확인 메일만이 답할 수 있다.
 *
 * 조회 자체가 실패한 경우(시간 초과 등)는 `unverifiable`로 따로 둔다. 그건
 * 도메인이 잘못됐다는 증거가 아니므로, "존재하지 않는 도메인"이라고 말하면
 * 사실이 아닌 것을 말하게 된다.
 */

export type EmailDomainCheck =
  | { ok: true }
  | { ok: false; reason: "not-found" | "no-mail" }
  | { ok: false; reason: "unverifiable"; detail: string };

export type EmailDomainFailure = Exclude<EmailDomainCheck, { ok: true }>["reason"];

/** 테스트에서 가짜를 넣을 수 있도록 쓰는 메서드만 요구한다. */
export interface DomainResolver {
  resolveMx(hostname: string): Promise<Array<{ exchange: string; priority: number }>>;
  resolve4(hostname: string): Promise<string[]>;
  resolve6(hostname: string): Promise<string[]>;
}

/** 가입 요청 하나가 DNS 때문에 한없이 늘어지지 않게 한다. */
const LOOKUP_TIMEOUT_MS = 2500;
const LOOKUP_TRIES = 2;

/** 이름이 없다(ENOTFOUND)거나 그 종류의 레코드가 없다(ENODATA)는, DNS가 준 확실한 답. */
const ABSENT_CODES = new Set(["ENOTFOUND", "ENODATA"]);

function errorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : "UNKNOWN";
}

/** 시스템 DNS 서버에 닿지 못할 때만 쓰는 공개 DNS (Cloudflare, Google). */
const FALLBACK_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];

function newResolver(servers?: string[]): Resolver {
  const resolver = new Resolver({ timeout: LOOKUP_TIMEOUT_MS, tries: LOOKUP_TRIES });
  if (servers) resolver.setServers(servers);
  return resolver;
}

/**
 * `resolver`를 주지 않으면 시스템 DNS로 묻는다.
 *
 * 일부 Windows PC에서는 Node의 DNS 라이브러리(c-ares)가 시스템 DNS 서버를 읽지
 * 못하고 127.0.0.1로 물어 연결 거부(ECONNREFUSED)가 난다 — 이 저장소 개발 PC에서
 * 실제로 그랬다. 브라우저와 nslookup은 멀쩡한데 가입만 503이 되므로, "DNS 서버에
 * 닿지 못함"일 때에 한해 공개 DNS로 한 번 더 묻는다. 이때 밖으로 나가는 것은
 * 주소 전체가 아니라 도메인(@ 뒤)뿐이다. 시간 초과 같은 다른 실패는 다시 묻지 않는다.
 */
export async function checkEmailDomain(
  domain: string,
  resolver?: DomainResolver,
  fallback: () => DomainResolver = () => newResolver(FALLBACK_DNS_SERVERS),
): Promise<EmailDomainCheck> {
  const result = await checkWith(domain, resolver ?? newResolver());
  if (!result.ok && result.reason === "unverifiable" && result.detail === "ECONNREFUSED") {
    return checkWith(domain, fallback());
  }
  return result;
}

async function checkWith(domain: string, resolver: DomainResolver): Promise<EmailDomainCheck> {
  let mx: Array<{ exchange: string }>;
  try {
    mx = await resolver.resolveMx(domain);
  } catch (error) {
    const code = errorCode(error);
    if (code === "ENOTFOUND") return { ok: false, reason: "not-found" };
    if (code !== "ENODATA") return { ok: false, reason: "unverifiable", detail: code };
    mx = [];
  }

  if (mx.length > 0) {
    // RFC 7505 "null MX" — 메일 서버 자리에 "."을 적어 "메일을 받지 않는다"고
    // 선언한 도메인이다(example.com이 그렇다). Node는 끝의 점을 떼어 빈 문자열로 준다.
    const acceptsMail = mx.some((record) => record.exchange !== "" && record.exchange !== ".");
    return acceptsMail ? { ok: true } : { ok: false, reason: "no-mail" };
  }

  // MX가 없으면 도메인 자체의 주소(A/AAAA)로 배달하는 것이 표준이다(RFC 5321 §5.1).
  const hosts = await Promise.allSettled([resolver.resolve4(domain), resolver.resolve6(domain)]);
  if (hosts.some((host) => host.status === "fulfilled" && host.value.length > 0)) {
    return { ok: true };
  }

  for (const host of hosts) {
    if (host.status === "rejected" && !ABSENT_CODES.has(errorCode(host.reason))) {
      return { ok: false, reason: "unverifiable", detail: errorCode(host.reason) };
    }
  }
  return { ok: false, reason: "no-mail" };
}

export function emailDomainMessage(domain: string, reason: EmailDomainFailure): string {
  switch (reason) {
    case "not-found":
      return `${domain} 은(는) 존재하지 않는 도메인입니다. 철자를 확인해주세요.`;
    case "no-mail":
      return `${domain} 은(는) 메일을 받을 수 없는 도메인입니다. 다른 이메일을 입력해주세요.`;
    case "unverifiable":
      return "지금은 이메일 도메인을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
}
