import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const SYNC_TOKEN = "sync-token-that-must-not-leave-this-browser";

/** 넷플릭스 하나와, 알림을 켜 둔 기기의 동기화 토큰이 든 저장소. */
function seed(): string {
  return JSON.stringify({
    state: {
      subscriptions: [
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
        },
      ],
      usageLogs: [],
      accounts: [],
      notify: {
        email: "me@example.com",
        syncToken: SYNC_TOKEN,
        verified: false,
        reminderDays: 3,
        lastSyncedAt: null,
        calendarUrl: null,
      },
    },
    version: 1,
  });
}

/**
 * 구독 목록의 카드. 페이지 전체에서 이름을 찾으면, 등록되지 않은 인기 서비스를
 * 권하는 추천 카드("혹시 이 서비스도…")까지 잡힌다.
 */
const subCard = (page: Page, name: string) => page.getByRole("link", { name: new RegExp(name) });

/** 비어 있을 때만 채운다. 복원한 결과를 다음 페이지 로드가 되돌리지 않게. */
async function seedOnce(page: Page) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("subslash-storage")) {
      localStorage.setItem("subslash-storage", value);
    }
  }, seed());
}

/** 다른 기기에서 저장해 온 백업: 유튜브 프리미엄(구독 중)과 멜론(해지). */
const OTHER_DEVICE_BACKUP = {
  app: "subslash",
  version: 1,
  exportedAt: "2026-09-01T00:00:00.000Z",
  data: {
    subscriptions: [
      {
        id: "youtube",
        name: "유튜브 프리미엄",
        amount: 14900,
        currency: "KRW",
        billingDay: 3,
        billingCycle: "monthly",
        category: "ott",
        status: "active",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "melon",
        name: "멜론",
        amount: 10900,
        currency: "KRW",
        billingDay: 20,
        billingCycle: "monthly",
        category: "music",
        status: "killed",
        createdAt: "2026-02-01T00:00:00.000Z",
        killedAt: "2026-06-01T00:00:00.000Z",
      },
    ],
    usageLogs: [],
    accounts: [],
    exchangeRate: { rate: null, source: "default", updatedAt: null },
  },
};

test.describe("데이터 백업 (E2E)", () => {
  test("백업 파일에 구독이 담기고, 동기화 토큰은 담기지 않는다", async ({ page }) => {
    await seedOnce(page);
    await page.goto("/subs");

    const card = page.getByRole("region", { name: "💾 데이터 백업" });
    await expect(card).toBeVisible({ timeout: 30_000 });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      card.getByRole("button", { name: "백업 파일 저장" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^subslash-backup-\d{4}-\d{2}-\d{2}\.json$/);

    const text = readFileSync(await download.path(), "utf8");
    expect(text).not.toContain(SYNC_TOKEN);
    const backup = JSON.parse(text);
    expect(backup.app).toBe("subslash");
    expect(backup.data.subscriptions.map((s: { name: string }) => s.name)).toEqual(["넷플릭스"]);
    expect(backup.data).not.toHaveProperty("notify");
  });

  test("복원하면 지금 목록을 백업 내용으로 통째로 바꾼다", async ({ page }) => {
    await seedOnce(page);
    await page.goto("/subs");

    const card = page.getByRole("region", { name: "💾 데이터 백업" });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(subCard(page, "넷플릭스")).toBeVisible();

    await card.getByLabel("백업 파일 선택").setInputFiles({
      name: "subslash-backup-2026-09-01.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(OTHER_DEVICE_BACKUP)),
    });

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/구독 2개 \(해지 1개\)/)).toBeVisible();
    await expect(dialog.getByText(/지금: 구독 1개/)).toBeVisible();
    await dialog.getByRole("button", { name: "복원" }).click();

    await expect(subCard(page, "유튜브 프리미엄")).toBeVisible();
    await expect(subCard(page, "넷플릭스")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "활성 구독 (1)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "해지 완료 (1)" })).toBeVisible();
  });

  test("백업이 아닌 파일은 아무것도 바꾸지 않고 이유를 알려준다", async ({ page }) => {
    await seedOnce(page);
    await page.goto("/subs");

    const card = page.getByRole("region", { name: "💾 데이터 백업" });
    await expect(card).toBeVisible({ timeout: 30_000 });

    await card.getByLabel("백업 파일 선택").setInputFiles({
      name: "notes.json",
      mimeType: "application/json",
      buffer: Buffer.from("this is not json"),
    });

    await expect(card.getByRole("alert")).toContainText("JSON 파일이 아닙니다");
    await expect(card.getByRole("alert")).toContainText("지금 데이터는 바뀌지 않았습니다");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(subCard(page, "넷플릭스")).toBeVisible();
  });
});
