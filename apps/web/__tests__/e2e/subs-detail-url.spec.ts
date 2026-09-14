import { test, expect } from "@playwright/test";

/**
 * 구독 상세는 /subs/<id>에서 /subs/detail?id=<id>로 옮겼다(앱에 화면을 정적으로 담으려고).
 * 북마크나 이미 보낸 예전 주소로 와도 같은 상세가 열려야 한다.
 */
test.describe("구독 상세 주소 (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "subslash-storage",
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
              },
            ],
            usageLogs: [],
            accounts: [],
          },
          version: 1,
        }),
      );
    });
  });

  test("예전 상세 주소는 새 주소로 보내고 같은 구독을 연다", async ({ page }) => {
    await page.goto("/subs/netflix");
    await expect(page).toHaveURL(/\/subs\/detail\?id=netflix$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "넷플릭스", exact: true })).toBeVisible();
  });

  test("id 없이 상세 주소로 오면 목록으로 보낸다", async ({ page }) => {
    await page.goto("/subs/detail");
    await expect(page).toHaveURL(/\/subs$/, { timeout: 30_000 });
  });
});
