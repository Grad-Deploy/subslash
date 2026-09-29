import { test, expect, type Page } from "@playwright/test";

/**
 * 구독 중인 서비스의 마지막 메일이 해지 알림이었을 때(`cancelNoticeAt`). 대시보드가 해지했는지 묻고,
 * 답에 따라 해지로 기록하거나 구독 중으로 둔다.
 */

const STORAGE_KEY = "subslash-storage";

async function seed(page: Page) {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(
      key,
      JSON.stringify({
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
              lastPriceCheckedAt: new Date().toISOString(),
              cancelNoticeAt: "2026.09.20",
            },
          ],
          usageLogs: [],
          accounts: [],
        },
        version: 1,
      }),
    );
  }, STORAGE_KEY);
}

async function statusOf(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").state.subscriptions[0],
    STORAGE_KEY,
  );
}

test.describe("해지 알림 메일 (E2E)", () => {
  test("'해지했어요'를 누르면 해지로 기록한다", async ({ page }) => {
    await seed(page);
    await page.goto("/dashboard");
    const row = page.getByRole("listitem").filter({ hasText: "넷플릭스" });
    await expect(row.getByText("해지 메일", { exact: true })).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: "해지했어요" }).click();

    await expect(page.getByText("넷플릭스 해지 완료로 기록")).toBeVisible();
    const sub = await statusOf(page);
    expect(sub.status).toBe("killed");
    expect(sub.cancelNoticeAt).toBeUndefined();
  });

  test("'아직 구독 중'을 누르면 구독 중으로 두고 같은 메일로 다시 묻지 않는다", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/dashboard");
    const row = page.getByRole("listitem").filter({ hasText: "넷플릭스" });
    await row.getByRole("button", { name: "아직 구독 중" }).click({ timeout: 30_000 });

    await expect(page.getByText("해지 메일", { exact: true })).toHaveCount(0);
    const sub = await statusOf(page);
    expect(sub.status).toBe("active");
    expect(sub.cancelNoticeAt).toBeUndefined();
    expect(sub.cancelNoticeDismissedAt).toBe("2026.09.20");
  });
});
