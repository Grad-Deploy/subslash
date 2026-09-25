/**
 * 같은 요청을 짧은 시간에 너무 많이 받지 않게 막는다(로그인 비밀번호 대입, 남의 주소로 메일 보내기).
 *
 * 서버 인스턴스의 메모리에 센다. Vercel은 인스턴스를 여럿 띄우고 재시작도 하므로 **완전한 차단이
 * 아니라 속도를 늦추는 장치**다 — 한 인스턴스가 받는 요청은 여기서 막히고, 여러 인스턴스를 도는
 * 대량 공격은 플랫폼의 방화벽(Vercel WAF 속도 제한)이 맡는다. DB에 세지 않는 것은 로그인 실패마다
 * 쓰기가 생기고, 계정을 잠그는 방식은 남이 일부러 틀려 주인을 못 들어오게 할 수 있어서다.
 */

interface Bucket {
  /** 창 안에서 센 시각들(ms). */
  hits: number[];
}

const buckets = new Map<string, Bucket>();
/** 메모리가 끝없이 늘지 않게, 이만큼 쌓이면 오래된 칸을 한 번 치운다. */
const SWEEP_AT = 5000;

function sweep(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.hits.every((at) => now - at >= windowMs)) buckets.delete(key);
  }
}

export interface RateLimitRule {
  /** 창 안에서 허용하는 횟수. */
  limit: number;
  windowMs: number;
}

/** 지금 막혀 있으면 다시 시도할 수 있을 때까지 남은 초, 아니면 0. 세지는 않는다. */
export function retryAfterSeconds(key: string, rule: RateLimitRule, now = Date.now()): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  bucket.hits = bucket.hits.filter((at) => now - at < rule.windowMs);
  if (bucket.hits.length < rule.limit) return 0;
  return Math.max(1, Math.ceil((bucket.hits[0] + rule.windowMs - now) / 1000));
}

/** 한 번 센다. */
export function hit(key: string, rule: RateLimitRule, now = Date.now()): void {
  if (buckets.size >= SWEEP_AT) sweep(now, rule.windowMs);
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((at) => now - at < rule.windowMs);
  bucket.hits.push(now);
  buckets.set(key, bucket);
}

/** 센 것을 지운다(로그인에 성공하면 그 아이디의 실패 횟수는 의미가 없다). */
export function reset(key: string): void {
  buckets.delete(key);
}

/** 테스트용. */
export function resetAllRateLimits(): void {
  buckets.clear();
}

/**
 * 요청한 쪽의 IP. Vercel은 `x-forwarded-for`의 맨 앞에 실제 접속 주소를 넣는다. 알 수 없으면
 * "unknown" — 그 경우 IP 기준 제한은 모두가 한 칸을 나눠 쓰게 되므로, 아이디·이메일 기준 제한과
 * 함께 쓴다.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}

export function tooManyRequestsMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes > 1
    ? `요청이 너무 많습니다. ${minutes}분 뒤에 다시 시도해 주세요.`
    : "요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요.";
}
