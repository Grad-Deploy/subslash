/**
 * 로그인한 기기끼리 구독 기록을 자동으로 맞출 때, 지금 무엇을 할지 정한다(hooks/useAccountSync가 실행).
 *
 * 서버에는 계정마다 기록 한 벌(account_snapshots)과 그 판을 가리키는 저장 시각(savedAt)이 있다.
 * 기기는 마지막으로 서버와 맞춘 판(baseSavedAt)과 그때 기록의 지문(baseHash)을 기억해, 어느 쪽이
 * 바뀌었는지 가른다.
 *
 * - 서버만 바뀌었으면 받아 온다. 이 기기에서 바뀐 것이 없으니 잃는 것이 없다.
 * - 이 기기만 바뀌었으면 "서버가 아직 그 판일 때만" 올린다(If-Match). 그사이 다른 기기가 올렸으면
 *   서버가 거절하고(409), 새 판으로 다시 가른다.
 * - 둘 다 바뀌었으면 합치지 않고 어느 쪽을 쓸지 묻는다. 합치는 규칙(같은 구독을 양쪽에서 고쳤다면?)은
 *   사용자가 알아채기 어려운 방식으로 무언가를 잃게 만든다(lib/account-snapshot).
 */
import type { BackupData } from "./store";

/** 서버에 올릴 때의 조건. `none`은 계정에 기록이 없을 때만, `match`는 계정의 기록이 그 판일 때만. */
export type SaveCondition = { kind: "none" } | { kind: "match"; savedAt: string };

export interface SyncBase {
  /** 마지막으로 서버와 맞춘 판. 이 기기에서 이 계정으로 맞춘 적이 없으면 null. */
  baseSavedAt: string | null;
  /** 그때 이 기기 기록의 지문. */
  baseHash: string | null;
}

export interface LocalView {
  hash: string;
  /** 구독·체크인·연동 계정이 하나도 없다. 이런 기기는 계정의 기록을 받아도 잃을 것이 없다. */
  empty: boolean;
}

export interface ServerView {
  /** 계정에 저장된 기록의 판. 없으면 null. */
  savedAt: string | null;
  /** 기록을 통째로 받아 왔을 때만 있는 지문. 요약만 받았으면 undefined. */
  hash?: string;
}

export type SyncDecision =
  | { kind: "idle" }
  /** 내용이 이미 같다. 판만 기억한다. */
  | { kind: "adopt"; savedAt: string }
  | { kind: "push"; condition: SaveCondition }
  /** 이 기기의 기록을 계정의 기록으로 바꾼다. */
  | { kind: "pull"; savedAt: string }
  /** 처음 맞추는데 양쪽에 서로 다른 기록이 있다(first), 또는 양쪽이 따로 바뀌었다(both-changed). */
  | { kind: "ask"; reason: "first" | "both-changed"; savedAt: string }
  /** 판단하려면 계정의 기록을 통째로 받아 지문을 봐야 한다. */
  | { kind: "need-server-hash" }
  /** 이 기기가 맞춰 오던 계정의 기록이 사라졌다 — 다른 기기에서 '계정에서 지우기'를 눌렀다. */
  | { kind: "stop"; reason: "deleted-elsewhere" };

export function decideSync(base: SyncBase, local: LocalView, server: ServerView): SyncDecision {
  if (!base.baseSavedAt) {
    if (!server.savedAt) {
      // 올릴 것이 없으면 계정에 빈 기록을 만들지 않는다. 기록이 생기면 그때 올린다.
      return local.empty ? { kind: "idle" } : { kind: "push", condition: { kind: "none" } };
    }
    if (local.empty) return { kind: "pull", savedAt: server.savedAt };
    if (server.hash === undefined) return { kind: "need-server-hash" };
    if (server.hash === local.hash) return { kind: "adopt", savedAt: server.savedAt };
    return { kind: "ask", reason: "first", savedAt: server.savedAt };
  }

  // 맞춰 오던 기록이 없어졌다. 다시 올리면 지운 사람의 뜻을 되돌리게 되므로 멈춘다.
  if (!server.savedAt) return { kind: "stop", reason: "deleted-elsewhere" };

  const localChanged = local.hash !== base.baseHash;
  if (server.savedAt === base.baseSavedAt) {
    return localChanged
      ? { kind: "push", condition: { kind: "match", savedAt: base.baseSavedAt } }
      : { kind: "idle" };
  }
  if (!localChanged) return { kind: "pull", savedAt: server.savedAt };
  if (server.hash !== undefined && server.hash === local.hash) {
    return { kind: "adopt", savedAt: server.savedAt };
  }
  return { kind: "ask", reason: "both-changed", savedAt: server.savedAt };
}

/** 기록의 지문(FNV-1a, 16진수). 같은 내용이면 기기와 상관없이 같은 값이다. */
export function recordsHash(data: BackupData): string {
  const text = JSON.stringify([
    data.subscriptions,
    data.usageLogs,
    data.accounts,
    data.exchangeRate,
  ]);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${text.length.toString(16)}-${(hash >>> 0).toString(16)}`;
}

export function isEmptyRecords(data: BackupData): boolean {
  return (
    data.subscriptions.length === 0 && data.usageLogs.length === 0 && data.accounts.length === 0
  );
}
