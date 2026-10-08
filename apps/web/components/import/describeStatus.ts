import type { DiscoveryStatus } from "@subslash/shared";
import type { Messages } from "@lib/i18n/messages";

/** 불러오기 후보의 상태 이유를 지금 언어의 문장으로 만든다. */
export function describeStatus(t: Messages, status: DiscoveryStatus): string {
  const s = t.importing.status;
  switch (status.type) {
    case "stale":
      return s.stale(status.daysAgo);
    case "recent":
      return s.recent(status.daysAgo);
    default:
      return s[status.type];
  }
}
