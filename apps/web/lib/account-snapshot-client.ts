import { apiFetch } from "./api";
import { parseBackup, type BackupFile, type BackupParseResult } from "./backup";
import type { SaveCondition, SnapshotSummary } from "./account-snapshot";

export type { SaveCondition, SnapshotSummary };

/**
 * 기기가 계정 기록(app/api/account/snapshot)을 부르는 곳. 자동 동기화(hooks/useAccountSync)와 설정의
 * '계정에 저장'·'계정에서 불러오기'(components/settings/DataBackupCard)가 함께 쓴다 — 예전에는 둘이
 * 주소·헤더·응답 읽기를 따로 적어, 한쪽만 고치면 같은 표를 서로 다르게 읽을 수 있었다.
 *
 * 응답을 어떻게 알릴지는 부르는 쪽이 정한다. 자동 동기화는 조용히 다음에 다시 하고, 설정 화면은
 * 서버의 오류 문장을 보여 준다. 그래서 실패하면 응답(`res`)을 그대로 돌려준다. 네트워크 오류는 던진다.
 */

type Failed = { kind: "failed"; res: Response };

export type SnapshotSummaryResult =
  { kind: "ok"; summary: SnapshotSummary } | { kind: "none" } | Failed;

export type SnapshotResult =
  | {
      kind: "ok";
      summary: SnapshotSummary;
      /** 서버가 검사한 기록이지만, 이 앱이 읽을 수 있는지 파일 복원과 같은 검사를 한 번 더 한 결과. */
      backup: BackupParseResult;
    }
  | { kind: "none" }
  | Failed;

export type SnapshotSaveResult =
  | { kind: "ok"; summary: SnapshotSummary }
  /** 조건(If-Match·If-None-Match)이 맞지 않았다. `current`는 지금 계정에 있는 기록(없으면 null). */
  | { kind: "conflict"; current: SnapshotSummary | null }
  | Failed;

const SNAPSHOT_PATH = "/api/account/snapshot";

export async function fetchSnapshotSummary(): Promise<SnapshotSummaryResult> {
  const res = await apiFetch(`${SNAPSHOT_PATH}?summary=1`);
  if (res.status === 404) return { kind: "none" };
  if (!res.ok) return { kind: "failed", res };
  return { kind: "ok", summary: (await res.json()).summary };
}

export async function fetchSnapshot(): Promise<SnapshotResult> {
  const res = await apiFetch(SNAPSHOT_PATH);
  if (res.status === 404) return { kind: "none" };
  if (!res.ok) return { kind: "failed", res };
  const body = await res.json();
  return { kind: "ok", summary: body.summary, backup: parseBackup(JSON.stringify(body.backup)) };
}

/** 판 조건을 요청 헤더로. 조건이 없으면(`any`) 덮어쓴다. */
export function saveConditionHeaders(condition: SaveCondition): Record<string, string> {
  switch (condition.kind) {
    case "any":
      return {};
    case "none":
      return { "If-None-Match": "*" };
    case "match":
      return { "If-Match": `"${condition.savedAt}"` };
  }
}

export async function saveSnapshot(
  backup: BackupFile,
  condition: SaveCondition = { kind: "any" },
): Promise<SnapshotSaveResult> {
  const res = await apiFetch(SNAPSHOT_PATH, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...saveConditionHeaders(condition) },
    body: JSON.stringify(backup),
  });
  if (res.status === 409) return { kind: "conflict", current: (await res.json()).summary ?? null };
  if (!res.ok) return { kind: "failed", res };
  return { kind: "ok", summary: (await res.json()).summary };
}

export async function deleteSnapshot(): Promise<{ kind: "ok" } | Failed> {
  const res = await apiFetch(SNAPSHOT_PATH, { method: "DELETE" });
  return res.ok ? { kind: "ok" } : { kind: "failed", res };
}
