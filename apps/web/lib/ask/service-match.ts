import { POPULAR_SERVICES, type ServicePreset, type Subscription } from "@subslash/shared";
import { subscriptionName } from "@lib/service-name";
import { compactName, expandAlias, isChosungOnly, isTypoOf, toChosung } from "./fuzzy";

/**
 * 사용자가 적은 서비스 이름("넷플", "쿠팡와우", "유튭", "ㄴㅍㄹㅅ", "넷플릭쓰")을 이름 목록과 맞춘다. 순서대로 보고,
 * 앞 단계에서 맞은 것이 있으면 거기서 멈춘다 — 느슨한 비교일수록 엉뚱한 것이 끼기 쉽다.
 *
 * 1. 이름이 적은 말을 품거나 그 반대(줄임말 표의 이름으로 바꾼 말도 본다)
 * 2. 초성만 적었으면 초성끼리
 * 3. 오타(lib/ask/fuzzy의 `isTypoOf`)
 *
 * 둘 이상 맞으면 모두 돌려준다 — 하나를 골라 답하면 다른 것의 숫자를 그 서비스의 것처럼 말하게 된다.
 */
function matchByNames<T>(query: string, items: readonly T[], namesOf: (item: T) => string[]): T[] {
  const wanted = compactName(query);
  if (wanted.length < 2) return [];
  const alias = expandAlias(query);
  const names = (item: T) => namesOf(item).map(compactName).filter(Boolean);

  const contains = items.filter((item) =>
    names(item).some((name) => [wanted, alias].some((q) => name.includes(q) || q.includes(name))),
  );
  if (contains.length > 0) return contains;

  if (isChosungOnly(wanted)) {
    // 앞에서부터 맞는 이름을 먼저 본다 — "ㄴㅍㄹㅅ"가 디즈니플러스(ㄷㅈㄴㅍㄹㅅ)에도 걸린다.
    const head = items.filter((item) =>
      names(item).some((name) => toChosung(name).startsWith(wanted)),
    );
    if (head.length > 0) return head;
    return items.filter((item) => names(item).some((name) => toChosung(name).includes(wanted)));
  }

  return items.filter((item) => names(item).some((name) => isTypoOf(wanted, name)));
}

/** 적은 이름에 맞는 이 기기의 구독. 영어로 물어도 한국어로 등록한 구독을(그 반대도) 서비스 목록의 두 이름으로 맞춘다. */
export function matchSubscriptions(query: string, subscriptions: Subscription[]): Subscription[] {
  return matchByNames(query, subscriptions, (sub) => [
    sub.name,
    subscriptionName(sub, "ko"),
    subscriptionName(sub, "en"),
  ]);
}

/**
 * 적은 이름에 맞는 서비스 목록의 서비스. 구독하지 않은 서비스의 요금을 물을 때 쓴다. 결합 상품(`includes`)은 그 이름을
 * 가리킨 게 아니면 뺀다 —"넷플릭스"에 '네이버플러스 + 넷플릭스'까지 걸려 되묻게 된다.
 */
export function matchPresets(query: string): ServicePreset[] {
  const found = matchByNames(query, POPULAR_SERVICES, (preset) =>
    [preset.nameKo, preset.nameEn, preset.name].filter((name): name is string => Boolean(name)),
  );
  const single = found.filter((preset) => !preset.includes);
  return single.length > 0 ? single : found;
}
