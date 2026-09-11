import { test, expect, type Page } from "@playwright/test";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 결제일이 10일 전이고 20일 전에 해지한 두 구독.
 *
 * 해지일과 결제일 사이가 한 달보다 짧으므로, 해지 뒤 지나간 결제일은 정확히
 * 한 번이다(다음 결제일은 20일쯤 뒤). 넷플릭스는 결제가 멈춘 것을 확인했고,
 * 멜론은 아직 답하지 않았다.
 */
function seed(): string {
  const now = Date.now();
  const billingDate = new Date(now - 10 * DAY_MS);
  const killedAt = new Date(now - 20 * DAY_MS).toISOString();
  const base = {
    currency: "KRW",
    billingDay: billingDate.getDate(),
    billingCycle: "monthly",
    category: "ott",
    status: "killed",
    createdAt: "2026-01-01T00:00:00.000Z",
    killedAt,
  };
  return JSON.stringify({
    state: {
      subscriptions: [
        {
          ...base,
          id: "netflix",
          name: "넷플릭스",
          amount: 17000,
          killVerifiedAt: new Date(now - 9 * DAY_MS).toISOString(),
        },
        { ...base, id: "melon", name: "멜론", amount: 10900, category: "music" },
      ],
      usageLogs: [],
      accounts: [],
    },
    version: 1,
  });
}

async function seedOnce(page: Page) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("subslash-storage")) {
      localStorage.setItem("subslash-storage", value);
    }
  }, seed());
}

test.describe("절약 세 칸 (E2E)", () => {
  test("절약 현황 맨 위에 지킨 돈, 확인 대기, 앞으로를 나눠 보여준다", async ({ page }) => {
    await seedOnce(page);
    await page.goto("/savings");

    const tiers = page.getByRole("region", { name: "✅ 지킨 돈" });
    await expect(tiers).toBeVisible({ timeout: 30_000 });
    // 확인한 넷플릭스의 한 번치만 지킨 돈이다.
    await expect(tiers.getByText("₩17,000", { exact: true })).toBeVisible();
    await expect(tiers.getByText("⏳ 확인 대기 ₩10,900 (1건)")).toBeVisible();
    // 앞으로: (17,000 + 10,900) × 12
    await expect(tiers.getByText(/연 ₩334,800 아끼는 중/)).toBeVisible();

    await tiers.getByRole("link", { name: /대시보드에서 답하기/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("멜론의 결제가 멈췄다고 답하면 지킨 돈에 더해진다", async ({ page }) => {
    await seedOnce(page);
    await page.goto("/dashboard");

    const card = page.getByRole("link", { name: /✅ 지킨 돈/ });
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByText("₩17,000", { exact: true })).toBeVisible();
    await expect(card).toContainText("확인 대기 ₩10,900");

    const row = page.getByRole("listitem").filter({ hasText: "멜론" });
    await row.getByRole("button", { name: "결제 안 됐어요" }).click();

    await expect(card.getByText("₩27,900", { exact: true })).toBeVisible();
    await expect(card).not.toContainText("확인 대기");
  });
});
