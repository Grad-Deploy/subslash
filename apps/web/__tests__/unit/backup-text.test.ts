import { describe, expect, it } from "vitest";
import {
  describeOverwrite,
  describeRestore,
  formatBackupDate,
  formatSavedAt,
  savedSummaryLine,
} from "../../components/settings/backupText";
import type { BackupData } from "@lib/store";
import { DEFAULT_EXCHANGE_RATE_SETTING } from "@lib/exchange-rate";
import type { Subscription } from "@subslash/shared";

const SUMMARY = {
  savedAt: "2026-10-01T09:05:00",
  subscriptionCount: 3,
  killedCount: 1,
  usageLogCount: 7,
  linkedAccountCount: 0,
};

const sub = (status: Subscription["status"]) => ({ status }) as Subscription;

const DATA: BackupData = {
  subscriptions: [sub("active"), sub("killed")],
  usageLogs: [],
  accounts: [],
  exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
};

const LOCAL = { subscriptionCount: 4, usageLogCount: 2 };

describe("날짜", () => {
  it("읽을 수 없는 날짜는 지어내지 않는다", () => {
    expect(formatBackupDate(null)).toBeNull();
    expect(formatBackupDate("nope")).toBeNull();
    expect(formatSavedAt("nope")).toBe("알 수 없는 시각");
    expect(formatSavedAt("2026-10-01T09:05:00")).toBe("2026년 10월 1일 09:05");
  });
});

describe("describeRestore", () => {
  it("바뀌는 쪽과 사라지는 쪽의 개수를 함께 적는다", () => {
    const text = describeRestore(
      { data: DATA, exportedAt: "2026-09-30T12:00:00", source: "file" },
      LOCAL,
      false,
    );
    expect(text).toContain("백업 (2026년 9월 30일): 구독 2개 (해지 1개), 체크인 0건");
    expect(text).toContain("지금: 구독 4개, 체크인 2건");
    expect(text).not.toContain("다른 기기");
  });

  it("계정 기록이고 자동 동기화 중이면 다른 기기도 바뀐다고 알린다", () => {
    const text = describeRestore({ data: DATA, exportedAt: null, source: "account" }, LOCAL, true);
    expect(text).toContain("계정에 저장된 기록: 구독 2개");
    expect(text).toContain("자동 동기화 중이라 다른 기기의 기록도 바뀌어요.");
  });
});

describe("계정 기록 요약", () => {
  it("덮어쓰기 확인과 마지막 저장 줄이 같은 개수를 쓴다", () => {
    expect(describeOverwrite(SUMMARY, LOCAL)).toContain(
      "계정 (2026년 10월 1일 09:05): 구독 3개 (해지 1개), 체크인 7건",
    );
    expect(savedSummaryLine(SUMMARY)).toBe(
      "마지막 저장 2026년 10월 1일 09:05 · 구독 3개 (해지 1개), 체크인 7건",
    );
  });
});
