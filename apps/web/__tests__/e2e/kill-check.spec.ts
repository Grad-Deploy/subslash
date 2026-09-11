import { test, expect, type Page } from "@playwright/test";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 40일 전에 해지한 매월 15일 결제 넷플릭스.
 *
 * 해지 뒤 첫 15일은 해지 후 31일 안에 오므로, 오늘 기준으로 이미 지났다.
 */
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
          status: "killed",
          createdAt: "2026-01-01T00:00:00.000Z",
          killedAt: new Date(Date.now() - 40 * DAY_MS).toISOString(),
        },
      ],
      usageLogs: [],
      accounts: [],
    },
    version: 1,
  });
}

/** 비어 있을 때만 채운다. 페이지를 옮길 때마다 답한 내용을 되돌리지 않게. */
async function seedOnce(page: Page) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("subslash-storage")) {
      localStorage.setItem("subslash-storage", value);
    }
  }, seed());
}

test.describe("해지 후 결제 확인 (E2E)", () => {
  test("결제가 없었다고 답하면 절약 현황에 확인됨으로 남는다", async ({ page }) => {
    await seedOnce(page);

    await page.goto("/savings");
    await expect(page.getByText(/에 결제가 됐는지 아직 확인하지/)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto("/dashboard");
    const row = page.getByRole("listitem").filter({ hasText: "넷플릭스" });
    await expect(row.getByText("해지 확인", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(row.getByText(/₩17,000이 결제됐나요/)).toBeVisible();

    await row.getByRole("button", { name: "결제 안 됐어요" }).click();
    await expect(page.getByText("해지 확인", { exact: true })).toHaveCount(0);

    await page.goto("/savings");
    await expect(page.getByText("해지 후 결제가 멈춘 것을 확인했습니다")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("결제가 됐다고 답하면 구독 중으로 되돌리고 해지 가이드를 연다", async ({ page }) => {
    await seedOnce(page);

    await page.goto("/dashboard");
    const row = page.getByRole("listitem").filter({ hasText: "넷플릭스" });
    await expect(row.getByText("해지 확인", { exact: true })).toBeVisible({ timeout: 30_000 });

    await row.getByRole("button", { name: "결제됐어요" }).click();
    await page.getByRole("button", { name: "되돌리고 가이드 열기" }).click();

    await expect(page.getByText("넷플릭스 해지 가이드")).toBeVisible();
    await expect(page.getByText("넷플릭스을(를) 구독 중으로 되돌렸습니다.")).toBeVisible();

    await page.keyboard.press("Escape");
    // 이제 활성 구독이므로 해지 확인 대신 평소의 할 일로 올라온다.
    await expect(page.getByText("해지 확인", { exact: true })).toHaveCount(0);
    await expect(row.getByRole("button", { name: "체크인하기" })).toBeVisible();
  });
});
