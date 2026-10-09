import type { Widen } from "../types";
import { one } from "../english";

/** PC의 AI 코딩 도구 사용을 체크인으로 받는 화면(`/pc-usage`, `npx subslash-usage`가 만든 링크). */
export const ko = {
  pcUsage: {
    title: "PC의 AI 코딩 도구 사용",
    description: (windowDays: number, until: string) =>
      `이 PC에서 Claude Code·Codex를 구독으로 쓴 날을 셌어요 (${until}까지 최근 ${windowDays}일).`,
    pcOnly:
      "PC에서 쓴 날만 들어 있어요. 웹·폰에서 쓴 날이 더 있으면 체크인 창에서 숫자를 늘려 주세요. 확인을 눌러야 저장돼요.",
    tool: { "claude-pro": "Claude Code", "chatgpt-plus": "Codex" },
    days: (days: number) => `PC 기록으로 ${days}일`,
    checkIn: "체크인에 적기",
    done: "체크인했어요",
    none: "이 서비스로 등록한 구독이 없어요. 구독을 등록하면 체크인할 수 있어요.",
    ambiguous: (count: number) =>
      `같은 서비스 구독이 ${count}개라 어디에 적을지 정할 수 없어요. 구독 상세에서 직접 체크인해 주세요.`,
    otherMetric: "이 구독은 쓴 날이 아닌 다른 기준으로 재요. 구독 상세에서 직접 체크인해 주세요.",
    invalidTitle: "읽을 수 없는 링크예요",
    invalidBody: "PC에서 npx subslash-usage를 다시 실행해 새 링크를 열어 주세요.",
    staleTitle: "오래된 링크예요",
    staleBody:
      "지난 숫자로 체크인하지 않도록 막았어요. PC에서 npx subslash-usage를 다시 실행해 주세요.",
    toSubs: "내 구독으로 →",
    privacy: "숫자는 링크의 # 뒤에만 있어 서버로 보내지 않았어요.",
  },
};

export const en: Widen<typeof ko> = {
  pcUsage: {
    title: "AI coding tool use on your PC",
    description: (windowDays, until) =>
      `Days you used Claude Code or Codex on a subscription on this PC (last ${windowDays} days up to ${until}).`,
    pcOnly:
      "Only days on this PC are included. If you also used it on the web or your phone, raise the number in the check-in. Nothing is saved until you confirm.",
    tool: { "claude-pro": "Claude Code", "chatgpt-plus": "Codex" },
    days: (days) => `${days} ${one(days) ? "day" : "days"} from PC records`,
    checkIn: "Check in",
    done: "Checked in",
    none: "You haven't added a subscription for this service. Add one to check in.",
    ambiguous: (count) =>
      `You have ${count} subscriptions for this service, so we can't tell which one to use. Check in from the subscription's details.`,
    otherMetric:
      "This subscription is measured by something other than days used. Check in from its details.",
    invalidTitle: "This link can't be read",
    invalidBody: "Run npx subslash-usage on your PC again and open the new link.",
    staleTitle: "This link is out of date",
    staleBody:
      "We stopped it so old numbers aren't checked in. Run npx subslash-usage on your PC again.",
    toSubs: "Go to subscriptions →",
    privacy: "The numbers are only after # in the link and weren't sent to the server.",
  },
};
