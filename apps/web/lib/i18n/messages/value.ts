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
