import { describe, expect, it } from "vitest";
import { decideSync, isEmptyRecords, recordsHash } from "@lib/account-sync";
import type { BackupData } from "@lib/store";

const FRESH = { baseSavedAt: null, baseHash: null };
const SYNCED = { baseSavedAt: "2026-09-15T01:00:00.000Z", baseHash: "h-base" };

const local = (hash: string, empty = false) => ({ hash, empty });

describe("decideSync — 이 기기에서 이 계정으로 처음 맞출 때", () => {
  it("양쪽 다 비었으면 아무것도 하지 않는다(빈 기록을 올리지 않음)", () => {
    expect(decideSync(FRESH, local("h", true), { savedAt: null })).toEqual({ kind: "idle" });
  });

  it("계정에 기록이 없으면 이 기기의 기록을 '없을 때만' 조건으로 올린다", () => {
    expect(decideSync(FRESH, local("h"), { savedAt: null })).toEqual({
      kind: "push",
      condition: { kind: "none" },
    });
  });

  it("이 기기가 비었으면 계정의 기록을 받아 온다", () => {
    expect(decideSync(FRESH, local("h", true), { savedAt: "s1" })).toEqual({
      kind: "pull",
      savedAt: "s1",
    });
  });

  it("양쪽에 기록이 있으면 지문을 보고, 같으면 판만 기억하고 다르면 묻는다", () => {
    expect(decideSync(FRESH, local("h"), { savedAt: "s1" })).toEqual({ kind: "need-server-hash" });
    expect(decideSync(FRESH, local("h"), { savedAt: "s1", hash: "h" })).toEqual({
      kind: "adopt",
      savedAt: "s1",
    });
    expect(decideSync(FRESH, local("h"), { savedAt: "s1", hash: "other" })).toEqual({
      kind: "ask",
      reason: "first",
      savedAt: "s1",
    });
  });
});

describe("decideSync — 맞춰 오던 계정", () => {
  it("아무도 바꾸지 않았으면 가만히 있는다", () => {
    expect(decideSync(SYNCED, local("h-base"), { savedAt: SYNCED.baseSavedAt })).toEqual({
      kind: "idle",
    });
  });

  it("이 기기만 바뀌었으면 '그 판일 때만' 조건으로 올린다", () => {
    expect(decideSync(SYNCED, local("h-new"), { savedAt: SYNCED.baseSavedAt })).toEqual({
      kind: "push",
      condition: { kind: "match", savedAt: SYNCED.baseSavedAt },
    });
  });

  it("서버만 바뀌었으면 받아 온다 — 이 기기에서 잃을 것이 없다", () => {
    expect(decideSync(SYNCED, local("h-base"), { savedAt: "s2" })).toEqual({
      kind: "pull",
      savedAt: "s2",
    });
  });

  it("양쪽이 따로 바뀌었으면 합치지 않고 묻는다", () => {
    expect(decideSync(SYNCED, local("h-new"), { savedAt: "s2" })).toEqual({
      kind: "ask",
      reason: "both-changed",
      savedAt: "s2",
    });
  });

  it("양쪽이 같은 내용으로 바뀌었으면 판만 기억한다", () => {
    expect(decideSync(SYNCED, local("h-new"), { savedAt: "s2", hash: "h-new" })).toEqual({
      kind: "adopt",
      savedAt: "s2",
    });
  });

  it("계정의 기록이 사라졌으면 다시 올리지 않고 멈춘다", () => {
    expect(decideSync(SYNCED, local("h-new"), { savedAt: null })).toEqual({
      kind: "stop",
      reason: "deleted-elsewhere",
    });
  });
});

describe("recordsHash / isEmptyRecords", () => {
  const data: BackupData = {
    subscriptions: [],
    usageLogs: [],
    accounts: [],
    exchangeRate: { rate: null, source: "default", updatedAt: null },
  } as unknown as BackupData;

  it("같은 내용이면 같은 지문, 한 칸이라도 다르면 다른 지문이다", () => {
    const copy = JSON.parse(JSON.stringify(data)) as BackupData;
    expect(recordsHash(copy)).toBe(recordsHash(data));
    const changed = { ...data, exchangeRate: { ...data.exchangeRate, rate: 1400 } } as BackupData;
    expect(recordsHash(changed)).not.toBe(recordsHash(data));
  });

  it("구독·체크인·연동 계정이 모두 없을 때만 비었다고 본다", () => {
    expect(isEmptyRecords(data)).toBe(true);
    expect(
      isEmptyRecords({ ...data, accounts: [{ id: "a", name: "n", emailOrId: "e" }] } as BackupData),
    ).toBe(false);
  });
});
