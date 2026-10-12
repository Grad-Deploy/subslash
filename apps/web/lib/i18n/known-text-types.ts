import type { BackupFieldLabel, BackupListLabel } from "../backup";

/**
 * `known-text`와 언어별 번역(`known-text-<언어>.ts`)이 함께 쓰는 모양. 언어별 파일은 `known-text`가 불러오므로
 * 그 파일을 거꾸로 불러오지 않게 여기 둔다.
 */

/** 정규식이 잡은 조각을 받아 그 언어의 문장을 만든다. */
export type KnownTextRender = (...groups: string[]) => string;

/** 백업 검사(lib/backup)가 틀렸다고 알리는 목록·칸 이름의 번역. 칸을 더하면 빈칸이 타입 오류로 드러난다. */
export type BackupListNames = Record<BackupListLabel, string>;
export type BackupFieldNames = Record<BackupFieldLabel, string>;

/** 메일을 다시 보낼 수 있을 때까지의 단위(describeSendOutcome·describeResetOutcome). */
export type WaitUnitNames = Record<"초" | "분" | "시간", string>;

/** 정규식이 잡은 이름을 표로 옮긴다. 표에 없는 이름은 그대로 — 뜻을 짐작해 지어내지 않는다. */
export function nameIn(table: Readonly<Record<string, string>>, key: string): string {
  return table[key] ?? key;
}
