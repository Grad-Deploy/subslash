import type { Faq } from "./faq";

/**
 * 도움말 검색(기기에서, AI 없이). 질문과 FAQ를 두 글자씩 잘라(바이그램) 겹치는 정도로 순위를 매긴다. 한국어는 띄어쓰기와
 * 조사가 제각각이라 낱말보다 두 글자 조각이 잘 맞는다. 질문 제목이 맞는 것을 답 본문보다 크게 친다.
 *
 * 첫 항목이 `CONFIDENT` 이상이고 둘째보다 `MARGIN` 이상 앞서면 자신 있다고 보고 '가장 비슷한 질문'으로 보여 준다 — 대부분의
 * 질문은 여기서 끝나 AI 한도를 쓰지 않는다. 점수만 보면 "Gmail 연결 끊고 싶어"가 '확인되지 않은 앱' 경고(0.71)를 저장
 * 항목(0.62)보다 앞에 내밀었다. 둘이 비슷하면 어느 쪽인지 모르는 것이라 자신 있다고 하지 않는다.
 */
export const CONFIDENT = 0.5;
export const MARGIN = 0.15;

const STOP = new Set(["어떻게", "하나요", "되나요", "있나요", "나요", "해요", "어요", "요"]);

function bigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP.has(word));
  const out = new Set<string>();
  for (const word of words) {
    if (word.length === 1) out.add(word);
    for (let i = 0; i < word.length - 1; i++) out.add(word.slice(i, i + 2));
  }
  return out;
}

export interface FaqHit {
  faq: Faq;
  score: number;
}

export function searchFaqs(question: string, faqs: Faq[], limit = 3): FaqHit[] {
  const wanted = bigrams(question);
  if (wanted.size === 0) return [];
  return faqs
    .map((faq) => {
      const title = bigrams(faq.q);
      const body = bigrams(faq.a);
      let score = 0;
      for (const gram of wanted) score += title.has(gram) ? 1 : body.has(gram) ? 0.35 : 0;
      return { faq, score: score / wanted.size };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** 첫 항목을 자신 있게 내밀어도 되는지. */
export function isConfident(hits: FaqHit[]): boolean {
  if (hits.length === 0 || hits[0].score < CONFIDENT) return false;
  return hits.length === 1 || hits[0].score - hits[1].score >= MARGIN;
}
