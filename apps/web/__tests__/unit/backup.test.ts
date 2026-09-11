import { describe, it, expect, beforeEach } from "vitest";
import type { LinkedAccount, Subscription, UsageLog } from "@subslash/shared";
import {
  BACKUP_VERSION,
  backupFileName,
  createBackup,
  parseBackup,
  type BackupFile,
} from "../../lib/backup";
import { DEFAULT_NOTIFY, useStore, type BackupData } from "../../lib/store";

const NOW = new Date(2026, 8, 11, 15, 30);

/** 앱이 실제로 만들어내는 모양의 데이터. */
function sampleData(): BackupData {
  const subscriptions: Subscription[] = [
    {
      id: "netflix",
      name: "넷플릭스",
      amount: 17000,
      currency: "KRW",
      billingDay: 15,
      billingCycle: "monthly",
      category: "ott",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      sharingCount: 4,
      linkedAccountId: "acc-1",
      linkedAccountName: "내 구글 (me@gmail.com)",
      paymentMethod: "credit_card",
    },
    {
      id: "chatgpt",
      name: "ChatGPT Plus",
      amount: 240,
      currency: "USD",
      billingDay: 3,
      billingCycle: "yearly",
      billingMonth: 5,
      category: "ai",
      status: "killed",
      createdAt: "2026-02-01T00:00:00.000Z",
      killedAt: "2026-04-20T03:00:00.000Z",
    },
  ];
  const usageLogs: UsageLog[] = [
    {
      id: "log-1",
      subscriptionId: "netflix",
      month: "2026-09",
      usageCount: 0,
      costPerUse: 4250,
      riskLevel: "red",
      checkedAt: "2026-09-01T00:00:00.000Z",
    },
  ];
  const accounts: LinkedAccount[] = [
    {
      id: "acc-1",
      provider: "google",
      name: "내 구글",
      emailOrId: "me@gmail.com",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];
  return {
    subscriptions,
    usageLogs,
    accounts,
    exchangeRate: { rate: 1382.5, source: "manual", updatedAt: "2026-09-01T00:00:00.000Z" },
  };
}

/** 저장한 파일을 다시 읽듯 JSON을 한 번 거친다. */
const roundTrip = (file: unknown) => parseBackup(JSON.stringify(file));

function withData(patch: (data: Record<string, unknown>) => void): BackupFile {
  const file = JSON.parse(JSON.stringify(createBackup(sampleData(), NOW)));
  patch(file.data);
  return file;
}

function errorOf(file: unknown): string {
  const result = roundTrip(file);
  if (result.ok) throw new Error("통과하면 안 되는 파일이 통과했다");
  return result.error;
}

describe("createBackup", () => {
  it("구독·체크인·계정·환율만 담고 알림 설정은 담지 않는다", () => {
    const file = createBackup(sampleData(), NOW);
    expect(file.app).toBe("subslash");
    expect(file.version).toBe(BACKUP_VERSION);
    expect(file.exportedAt).toBe(NOW.toISOString());
    expect(Object.keys(file.data).sort()).toEqual([
      "accounts",
      "exchangeRate",
      "subscriptions",
      "usageLogs",
    ]);
  });

  it("파일 이름은 사용자가 있는 곳의 날짜", () => {
    expect(backupFileName(NOW)).toBe("subslash-backup-2026-09-11.json");
  });
});

describe("parseBackup — 앱이 만든 것은 모두 통과한다", () => {
  it("저장한 그대로 되돌아온다", () => {
    const result = roundTrip(createBackup(sampleData(), NOW));
    expect(result).toEqual({ ok: true, data: sampleData(), exportedAt: NOW.toISOString() });
  });

  it("결제일·금액을 비워 둔 구독도 통과한다 — 폼이 '적지 않음'으로 저장한다", () => {
    const file = withData((data) => {
      const [sub] = data.subscriptions as Record<string, unknown>[];
      delete sub.billingDay;
      delete sub.amount;
    });
    expect(roundTrip(file).ok).toBe(true);
  });

  it("모르는 칸은 버리지 않는다 — 새 버전이 더한 기록이 복원에서 사라지면 안 된다", () => {
    const file = withData((data) => {
      const [, killed] = data.subscriptions as Record<string, unknown>[];
      killed.killVerifiedAt = "2026-05-04T00:00:00.000Z";
    });
    const result = roundTrip(file);
    expect(result.ok && result.data.subscriptions[1]).toMatchObject({
      killVerifiedAt: "2026-05-04T00:00:00.000Z",
    });
  });

  it("환율 설정이 없는 백업은 기본값으로 둔다", () => {
    const file = withData((data) => {
      delete data.exchangeRate;
    });
    const result = roundTrip(file);
    expect(result.ok && result.data.exchangeRate).toEqual({
      rate: null,
      source: "default",
      updatedAt: null,
    });
  });
});

describe("parseBackup — 틀린 파일은 아무것도 넘기지 않고 이유를 말한다", () => {
  it("JSON이 아니다", () => {
    expect(parseBackup("not json")).toEqual({
      ok: false,
      error: expect.stringContaining("JSON 파일이 아닙니다"),
    });
  });

  it("다른 앱의 파일이다", () => {
    expect(errorOf({ app: "other", version: 1, data: {} })).toContain(
      "SubSlash 백업 파일이 아닙니다",
    );
  });

  it("더 새로운 형식이다", () => {
    const file = { ...createBackup(sampleData(), NOW), version: BACKUP_VERSION + 1 };
    expect(errorOf(file)).toContain("새로운 형식");
  });

  it("목록이 빠졌다", () => {
    const file = withData((data) => {
      delete data.usageLogs;
    });
    expect(errorOf(file)).toContain("목록이 모두 있어야");
  });

  it.each([
    ["금액이 글자", (s: Record<string, unknown>) => (s.amount = "17000"), "금액"],
    ["모르는 통화", (s: Record<string, unknown>) => (s.currency = "EUR"), "통화"],
    ["없는 결제일", (s: Record<string, unknown>) => (s.billingDay = 32), "결제일"],
    ["없는 결제 월", (s: Record<string, unknown>) => (s.billingMonth = 13), "결제 월"],
    ["모르는 상태", (s: Record<string, unknown>) => (s.status = "paused"), "상태"],
    ["깨진 해지일", (s: Record<string, unknown>) => (s.killedAt = "어제"), "해지일"],
  ])("구독 칸이 틀렸다: %s", (_, breakIt, field) => {
    const file = withData((data) => breakIt((data.subscriptions as Record<string, unknown>[])[0]));
    expect(errorOf(file)).toBe(`구독 1번째 항목의 '${field}' 칸이 올바르지 않습니다.`);
  });

  it("구독 ID가 겹친다", () => {
    const file = withData((data) => {
      const subs = data.subscriptions as Record<string, unknown>[];
      subs[1].id = subs[0].id;
    });
    expect(errorOf(file)).toContain("구독 2번째 항목의 ID가 다른 구독과 겹칩니다");
  });

  it("체크인 기록의 위험도가 틀렸다", () => {
    const file = withData((data) => {
      (data.usageLogs as Record<string, unknown>[])[0].riskLevel = "purple";
    });
    expect(errorOf(file)).toBe("체크인 기록 1번째 항목의 '위험도' 칸이 올바르지 않습니다.");
  });

  it("연동 계정의 제공자가 틀렸다", () => {
    const file = withData((data) => {
      (data.accounts as Record<string, unknown>[])[0].provider = "yahoo";
    });
    expect(errorOf(file)).toBe("연동 계정 1번째 항목의 '로그인 제공자' 칸이 올바르지 않습니다.");
  });

  it("환율이 말이 안 된다", () => {
    const file = withData((data) => {
      data.exchangeRate = { rate: -1, source: "manual", updatedAt: null };
    });
    expect(errorOf(file)).toContain("환율 설정이 올바르지 않습니다");
  });
});

describe("replaceAllData", () => {
  beforeEach(() => {
    useStore.setState({
      subscriptions: [],
      usageLogs: [],
      accounts: [],
      notify: { ...DEFAULT_NOTIFY, email: "me@example.com", syncToken: "this-device-token" },
    });
  });

  it("지금 데이터를 백업 내용으로 통째로 바꾸고, 이 기기의 알림 설정은 그대로 둔다", () => {
    useStore.getState().addSubscription({
      name: "지금 있던 구독",
      amount: 5000,
      currency: "KRW",
      billingDay: 1,
      billingCycle: "monthly",
      category: "other",
    });

    useStore.getState().replaceAllData(sampleData());

    const state = useStore.getState();
    expect(state.subscriptions.map((s) => s.name)).toEqual(["넷플릭스", "ChatGPT Plus"]);
    expect(state.usageLogs).toHaveLength(1);
    expect(state.accounts).toHaveLength(1);
    expect(state.exchangeRate.rate).toBe(1382.5);
    expect(state.notify.syncToken).toBe("this-device-token");
  });

  it("옛 백업에 든 폐기된 해지 링크를 지금 주소로 바꾼다", () => {
    const data = sampleData();
    data.subscriptions[0] = {
      ...data.subscriptions[0],
      name: "멜론",
      cancelUrl: "https://member.melon.com/pay/charge/payCancel.htm",
    };

    useStore.getState().replaceAllData(data);

    expect(useStore.getState().subscriptions[0].cancelUrl).toBe("https://www.melon.com/");
  });
});
