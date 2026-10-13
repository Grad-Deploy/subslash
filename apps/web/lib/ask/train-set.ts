import type { Locale } from "../i18n/config";
import type { AskCall } from "./tools";
import data from "./train-set.json";

/**
 * '리포트에 물어보기'의 학습 세트. 기기에서 도구를 고르는 규칙·분류기(lib/ask/local)를 만들 때 이 세트만 보고, 평가
 * 세트(`eval-set.ts`)는 보지 않는다 — 평가 세트를 보며 다듬으면 그 세트의 정답률은 처음 보는 질문에서의 정답률이 아니게
 * 된다. 그래서 두 세트에 같은 질문이 있으면 안 된다(테스트가 확인한다).
 *
 * 질문은 AI가 바꿔 쓴 것이지만 정답은 사람이 정한다: `pnpm --filter @subslash/web ask:train generate`가 만든 검수
 * 파일에서 사람이 줄마다 `keep`을 정하고, `ask:train accept`로 그 줄만 여기 넣는다(scripts/ask-train). 이 파일을 손으로
 * 고칠 때도 같다. 꼬리 질문(앞선 턴이 있는 질문)은 두지 않는다 — 기기 규칙은 꼬리 질문을 AI에 넘긴다.
 */
export interface AskTrainCase {
  q: string;
  call: AskCall;
  locale: Locale;
}

export const ASK_TRAIN_SET = data as readonly AskTrainCase[];

/** 같은 질문인지 견줄 때 쓰는 열쇠. 띄어쓰기·문장부호·대소문자만 다른 질문은 같은 질문이다. */
export const askQuestionKey = (q: string) => q.toLowerCase().replace(/[\s?!.,~·'"…]/g, "");
