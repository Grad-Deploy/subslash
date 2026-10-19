/**
 * '리포트에 물어보기'에서 사용자가 적은 서비스 이름을 구독 이름과 맞출 때 쓰는 느슨한 비교(lib/ask/answer의
 * `matchSubscriptions`). 맞는 구독이 둘 이상이면 부르는 쪽이 고르지 않고 되묻는다 — 여기서 넓게 잡아도 다른
 * 구독의 숫자를 그 서비스의 것처럼 말하지는 않는다.
 */

/** 띄어쓰기·가운뎃점·마침표·하이픈을 지운 소문자. */
export const compactName = (text: string) => text.toLowerCase().replace(/[\s·.\-_]/g, "");

/**
 * 널리 쓰는 줄임말 → 서비스 이름. 앞부분 줄임말("넷플", "디즈")은 포함 비교로 이미 맞으므로 적지 않고, 글자가
 * 달라지는 것만 적는다. 줄임말이 가리키는 서비스가 분명한 것만 둔다.
 */
const ALIASES: Readonly<Record<string, string>> = {
  유튭: "유튜브",
  유투브: "유튜브",
  유뮤: "유튜브뮤직",
  유프: "유튜브프리미엄",
  유튭프리: "유튜브프리미엄",
  유튜브프리: "유튜브프리미엄",
  유튭프리미엄: "유튜브프리미엄",
  쿠플: "쿠팡플레이",
  와우: "쿠팡와우",
  와우멤버십: "쿠팡와우",
  쿠팡멤버십: "쿠팡와우",
  디플: "디즈니플러스",
  "디즈니+": "디즈니플러스",
  애플티비: "appletv",
  애티비: "appletv",
  애플뮤직: "applemusic",
  애뮤: "applemusic",
  아클: "아이클라우드",
  네플멤: "네이버플러스",
  네이버멤버십: "네이버플러스",
  네이버플러스멤버십: "네이버플러스",
  밀서: "밀리의서재",
  프라임비디오: "아마존프라임비디오",
  아마존프라임: "아마존프라임비디오",
  챗지피티: "chatgpt",
  챗gpt: "chatgpt",
  지피티: "chatgpt",
  gpt: "chatgpt",
  클로드: "claude",
  제미나이: "gemini",
  제미니: "gemini",
  잼민이: "gemini",
  퍼플렉시티: "perplexity",
  코파일럿: "copilot",
  깃허브코파일럿: "copilot",
  커서: "cursor",
  오피스: "마이크로소프트365",
  오피스365: "마이크로소프트365",
  ms365: "마이크로소프트365",
  엠에스365: "마이크로소프트365",
};

/** 줄임말 표의 줄임말들. 질문에 서비스 이름이 들었는지 볼 때 쓴다(lib/ask/local). */
export const ALIAS_NAMES: readonly string[] = Object.keys(ALIASES);

export function expandAlias(query: string): string {
  return ALIASES[compactName(query)] ?? compactName(query);
}

const CHOSUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

/** 한글 음절을 초성으로("넷플릭스" → "ㄴㅍㄹㅅ"). 한글이 아닌 글자는 그대로 둔다. */
export function toChosung(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.charCodeAt(0) - 0xac00;
    out += code >= 0 && code < 11172 ? CHOSUNG[Math.floor(code / 588)] : char;
  }
  return out;
}

/** 초성만으로 적은 말인지("ㄴㅍㄹㅅ"). 두 글자 이상만 본다. */
export function isChosungOnly(text: string): boolean {
  return text.length >= 2 && [...text].every((char) => CHOSUNG.includes(char));
}

/** 편집 거리(글자 넣기·빼기·바꾸기, 이웃한 두 글자 맞바꾸기는 1). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * 오타로 보아 줄 거리. 짧은 이름일수록 한 글자 차이로 다른 서비스가 되므로 좁다 — 세 글자 미만은 오타로 보지 않는다
 * ("티빙"과 "티방"은 같은 서비스라고 단정할 수 없다).
 */
export function typoAllowance(length: number): number {
  if (length < 3) return 0;
  if (length < 6) return 1;
  return 2;
}

/** 오타로 비슷한지. 적은 말과 이름의 앞부분(같은 길이)을 견준다 — "넷플릭쓰" ↔ "넷플릭스 프리미엄"의 앞. */
export function isTypoOf(query: string, name: string): boolean {
  const allowance = typoAllowance(query.length);
  if (allowance === 0 || name.length < query.length - allowance) return false;
  const head = name.slice(0, query.length);
  return editDistance(query, name) <= allowance || editDistance(query, head) <= allowance;
}
