import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subscription } from "@subslash/shared";

/**
 * 대시보드 '시작하기'(구독 등록·체크인·결제 알림, 닫음)가 기록 주인을 따른다.
 *
 * 예전에는 로그인해 구독을 등록하고 알림을 켠 뒤 로그아웃하면, 구독 기록은 로그인 전으로 돌아가도 결제
 * 알림 켜짐·닫음·'알림 켤까요' 물음이 기기에 하나뿐이라 로그인한 동안의 진행이 그대로 보였다.
 */

const ORIGINAL_TARGET = process.env.NEXT_PUBLIC_BUILD_TARGET;
const REMINDERS = "subslash-local-reminders";
const DISMISSED = "subslash_app_start_dismissed";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

function sub(name: string): Subscription {
  return {
    id: `id-${name}`,
    name,
    amount: 10000,
    currency: "KRW",
    billingDay: 1,
    billingCycle: "monthly",
    category: "other",
    status: "active",
    createdAt: "2026-09-01T00:00:00.000Z",
  } as Subscription;
}

let local: ReturnType<typeof memoryStorage>;

beforeEach(() => {
  local = memoryStorage();
  vi.stubGlobal("localStorage", local);
  process.env.NEXT_PUBLIC_BUILD_TARGET = "app";
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_BUILD_TARGET = ORIGINAL_TARGET;
  vi.unstubAllGlobals();
});

async function load() {
  const store = await import("../../lib/store");
  const owner = await import("../../lib/owner-scoped");
  const prompt = await import("../../lib/reminder-prompt");
  const records = await import("../../lib/records-owner");
  store.useStore.setState({
    subscriptions: [],
    usageLogs: [],
    accounts: [],
    recordsOwner: null,
    accountSync: store.DEFAULT_ACCOUNT_SYNC,
    demo: null,
  });
  return { ...store, ...owner, ...prompt, ...records };
}

/** '시작하기'가 보는 값들(대시보드가 AppStartChecklist에 넘기는 것과 같다). */
function checklist(m: Awaited<ReturnType<typeof load>>) {
  const state = m.useStore.getState();
  const reminders = JSON.parse(m.readOwnerScoped(local, REMINDERS) ?? "{}") as {
    enabled?: boolean;
  };
  return {
    hasSubscription: state.subscriptions.some((s) => s.status === "active"),
    remindersOn: reminders.enabled === true,
    dismissed: local.getItem(m.ownerScopedKey(DISMISSED)) === "true",
    promptReminder: m.shouldPromptReminder(reminders.enabled === true),
  };
}

describe("시작하기는 기록 주인을 따른다", () => {
  it("주인마다 다른 키를 쓴다", async () => {
    const m = await load();
    expect(m.ownerScopedKey(REMINDERS, null)).toBe(`${REMINDERS}:guest`);
    expect(m.ownerScopedKey(REMINDERS, "acc-1")).toBe(`${REMINDERS}:account:acc-1`);
  });

  it("로그아웃하면 처음부터 시작하고, 다시 로그인하면 그 계정의 진행이 돌아온다", async () => {
    const m = await load();
    const records = memoryStorage();

    // 로그인 → 구독 등록 → 알림 켜기(묻고) → 시작하기 닫기
    m.switchRecordsOwner("acc-1", records);
    m.useStore.setState({ subscriptions: [sub("배민클럽")] });
    local.setItem(m.ownerScopedKey(REMINDERS), JSON.stringify({ enabled: true, daysBefore: 3 }));
    m.markReminderPrompted();
    local.setItem(m.ownerScopedKey(DISMISSED), "true");
    expect(checklist(m)).toEqual({
      hasSubscription: true,
      remindersOn: true,
      dismissed: true,
      promptReminder: false,
    });

    // 로그아웃: 아무것도 반영되지 않은 시작하기
    m.switchRecordsOwner(null, records);
    expect(checklist(m)).toEqual({
      hasSubscription: false,
      remindersOn: false,
      dismissed: false,
      promptReminder: true,
    });

    // 다시 로그인: 그 계정에서 했던 대로
    m.switchRecordsOwner("acc-1", records);
    expect(checklist(m)).toEqual({
      hasSubscription: true,
      remindersOn: true,
      dismissed: true,
      promptReminder: false,
    });
  });

  it("다른 계정은 앞 계정의 진행을 보지 않는다", async () => {
    const m = await load();
    const records = memoryStorage();
    m.switchRecordsOwner("acc-1", records);
    local.setItem(m.ownerScopedKey(REMINDERS), JSON.stringify({ enabled: true, daysBefore: 3 }));
    local.setItem(m.ownerScopedKey(DISMISSED), "true");
    m.switchRecordsOwner(null, records);
    m.switchRecordsOwner("acc-2", records);
    expect(checklist(m)).toMatchObject({ remindersOn: false, dismissed: false });
  });

  it("주인별로 나누기 전의 설정은 지금 주인의 칸으로 한 번 옮긴다(업데이트해도 알림이 꺼지지 않게)", async () => {
    const m = await load();
    m.useStore.setState({ recordsOwner: "acc-1" });
    local.setItem(REMINDERS, JSON.stringify({ enabled: true, daysBefore: 1 }));
    expect(JSON.parse(m.readOwnerScoped(local, REMINDERS)!)).toEqual({
      enabled: true,
      daysBefore: 1,
    });
    expect(local.getItem(REMINDERS)).toBeNull();
    expect(local.getItem(`${REMINDERS}:account:acc-1`)).not.toBeNull();
    // 비로그인에는 옮겨 가지 않는다.
    expect(m.readOwnerScoped(local, REMINDERS, null)).toBeNull();
  });
});
