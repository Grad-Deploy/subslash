import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CliDayKey } from "@subslash/shared";
import {
  EVIDENCE_KEY,
  forgetEvidence,
  mergeEvidence,
  readEvidence,
  saveEvidence,
} from "../../lib/pc-usage-evidence";

/**
 * 같은 구독의 쓴 날을 다른 때 읽은 기록끼리 합친다. Claude Code(PC)와 claude.ai 내보내기(웹·앱)는 서로 다른 사용을
 * 세므로 날짜의 합집합이 맞다 — 평균이나 큰 값이 아니다.
 */

const at = (iso: string) => Date.parse(iso);
/** 한국 시간 날짜. 테스트가 돌아가는 PC의 시간대와 상관없게 한다. */
const kstDay: CliDayKey = (ms) => new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const NOW = at("2026-10-12T12:00:00+09:00");
const options = { now: NOW, windowDays: 30, dayKey: kstDay };

describe("근거 합치기", () => {
  it("이번에 읽은 기록과 이 기기에 남은 다른 기록의 날짜를 합집합으로 합친다", () => {
    const merged = mergeEvidence(
      [{ source: "claudeWeb", days: ["2026-10-03", "2026-10-05"], at: NOW }],
      {
        claude: {
          days: ["2026-10-05", "2026-10-07"],
          coveredUntil: at("2026-10-10T09:00:00+09:00"),
        },
      },
      options,
    );
    expect(merged.days).toBe(3);
    expect(merged.overlap).toBe(1);
    expect(merged.parts).toEqual([
      { source: "claudeWeb", days: 2, coveredUntil: NOW, fromSaved: false },
      { source: "claude", days: 2, coveredUntil: at("2026-10-10T09:00:00+09:00"), fromSaved: true },
    ]);
  });

  it("같은 출처는 이번에 읽은 것을 쓴다", () => {
    const merged = mergeEvidence(
      [{ source: "claude", days: ["2026-10-11"], at: NOW }],
      { claude: { days: ["2026-10-01", "2026-10-02"], coveredUntil: NOW - 1000 } },
      options,
    );
    expect(merged.days).toBe(1);
    expect(merged.parts).toHaveLength(1);
  });

  it("기간 밖의 날과, 기간이 시작되기 전에 끝난 근거는 세지 않는다", () => {
    const merged = mergeEvidence(
      [{ source: "claude", days: ["2026-09-01", "2026-10-11"], at: NOW }],
      {
        claudeWeb: { days: ["2026-08-20"], coveredUntil: at("2026-08-25T00:00:00+09:00") },
      },
      options,
    );
    expect(merged.days).toBe(1);
    expect(merged.parts.map((part) => part.source)).toEqual(["claude"]);
  });
});

describe("이 기기에 남기기", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("출처마다 마지막 근거 하나만 두고, 오래된 날짜는 지운다", () => {
    saveEvidence(
      "claude-pro",
      "claude",
      { days: ["2026-08-01", "2026-10-11"], coveredUntil: NOW },
      kstDay,
    );
    saveEvidence("claude-pro", "claudeWeb", { days: ["2026-10-03"], coveredUntil: NOW }, kstDay);
    saveEvidence("claude-pro", "claude", { days: ["2026-10-12"], coveredUntil: NOW }, kstDay);
    expect(readEvidence()["claude-pro"]).toEqual({
      claude: { days: ["2026-10-12"], coveredUntil: NOW },
      claudeWeb: { days: ["2026-10-03"], coveredUntil: NOW },
    });
  });

  it("40일보다 지난 날짜는 남기지 않는다", () => {
    saveEvidence(
      "claude-pro",
      "claude",
      { days: ["2026-08-01", "2026-10-11"], coveredUntil: NOW },
      kstDay,
    );
    expect(readEvidence()["claude-pro"]?.claude?.days).toEqual(["2026-10-11"]);
  });

  it("지우면 그 구독의 근거만 사라진다", () => {
    saveEvidence("claude-pro", "claude", { days: ["2026-10-11"], coveredUntil: NOW }, kstDay);
    saveEvidence("chatgpt-plus", "codex", { days: ["2026-10-11"], coveredUntil: NOW }, kstDay);
    forgetEvidence("claude-pro");
    expect(Object.keys(readEvidence())).toEqual(["chatgpt-plus"]);
  });

  it("깨진 저장값은 비어 있는 것으로 본다", () => {
    store.set(EVIDENCE_KEY, "{깨짐");
    expect(readEvidence()).toEqual({});
    store.set(EVIDENCE_KEY, "[1]");
    expect(readEvidence()).toEqual({});
  });
});
