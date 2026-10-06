import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBackup } from "@lib/backup";
import type { BackupData } from "@lib/store";
import { DEFAULT_EXCHANGE_RATE_SETTING } from "@lib/exchange-rate";

const apiFetch = vi.fn<(path: string, init?: RequestInit) => Promise<Response>>();

vi.mock("../../lib/api", () => ({
  apiFetch: (path: string, init?: RequestInit) => apiFetch(path, init),
}));

const { deleteSnapshot, fetchSnapshot, fetchSnapshotSummary, saveConditionHeaders, saveSnapshot } =
  await import("../../lib/account-snapshot-client");

const SUMMARY = {
  savedAt: "2026-10-01T00:00:00.000Z",
  subscriptionCount: 2,
  killedCount: 1,
  usageLogCount: 3,
  linkedAccountCount: 0,
};

const EMPTY: BackupData = {
  subscriptions: [],
  usageLogs: [],
  accounts: [],
  exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => apiFetch.mockReset());

describe("saveConditionHeaders", () => {
  it("판 조건을 If-Match·If-None-Match로 바꾸고, 조건이 없으면 헤더를 싣지 않는다", () => {
    expect(saveConditionHeaders({ kind: "any" })).toEqual({});
    expect(saveConditionHeaders({ kind: "none" })).toEqual({ "If-None-Match": "*" });
    expect(saveConditionHeaders({ kind: "match", savedAt: "s1" })).toEqual({ "If-Match": '"s1"' });
  });
});

describe("fetchSnapshotSummary", () => {
  it("요약만 묻고, 404는 기록 없음으로 읽는다", async () => {
    apiFetch.mockResolvedValueOnce(json({ summary: SUMMARY }));
    expect(await fetchSnapshotSummary()).toEqual({ kind: "ok", summary: SUMMARY });
    expect(apiFetch.mock.calls[0][0]).toBe("/api/account/snapshot?summary=1");

    apiFetch.mockResolvedValueOnce(json({ status: "none" }, 404));
    expect(await fetchSnapshotSummary()).toEqual({ kind: "none" });
  });

  it("그 밖의 실패는 응답을 그대로 돌려준다(오류 문장은 부르는 쪽이 읽는다)", async () => {
    apiFetch.mockResolvedValueOnce(json({ error: "로그인이 필요합니다." }, 401));
    const result = await fetchSnapshotSummary();
    expect(result.kind).toBe("failed");
    expect(result.kind === "failed" && result.res.status).toBe(401);
  });
});

describe("fetchSnapshot", () => {
  it("받은 기록을 파일 복원과 같은 검사로 다시 읽는다", async () => {
    apiFetch.mockResolvedValueOnce(json({ summary: SUMMARY, backup: createBackup(EMPTY) }));
    const result = await fetchSnapshot();
    expect(result.kind === "ok" && result.backup.ok).toBe(true);

    apiFetch.mockResolvedValueOnce(json({ summary: SUMMARY, backup: { app: "other" } }));
    const broken = await fetchSnapshot();
    expect(broken.kind === "ok" && broken.backup.ok).toBe(false);
  });
});

describe("saveSnapshot", () => {
  it("조건 헤더를 실어 올리고, 409는 지금 계정의 요약과 함께 돌려준다", async () => {
    apiFetch.mockResolvedValueOnce(json({ error: "바뀌었어요", summary: SUMMARY }, 409));
    const result = await saveSnapshot(createBackup(EMPTY), { kind: "match", savedAt: "old" });
    expect(result).toEqual({ kind: "conflict", current: SUMMARY });
    const init = apiFetch.mock.calls[0][1]!;
    expect(init.method).toBe("PUT");
    expect(init.headers).toEqual({ "Content-Type": "application/json", "If-Match": '"old"' });
  });

  it("조건 없이 올리면 덮어쓰고 새 요약을 돌려준다", async () => {
    apiFetch.mockResolvedValueOnce(json({ summary: SUMMARY }));
    expect(await saveSnapshot(createBackup(EMPTY))).toEqual({ kind: "ok", summary: SUMMARY });
    expect(apiFetch.mock.calls[0][1]!.headers).toEqual({ "Content-Type": "application/json" });
  });
});

describe("deleteSnapshot", () => {
  it("DELETE로 지운다", async () => {
    apiFetch.mockResolvedValueOnce(json({ ok: true }));
    expect(await deleteSnapshot()).toEqual({ kind: "ok" });
    expect(apiFetch.mock.calls[0][1]!.method).toBe("DELETE");
  });
});
