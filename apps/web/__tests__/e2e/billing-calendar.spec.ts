import { test, expect, type Page } from "@playwright/test";

/**
 * 대시보드 결제 캘린더. 날짜 계산은 유닛 테스트가 보므로, 여기서는 화면이 그 결과를 어떻게
 * 말하는지 본다 — 같은 날 결제를 모아 보여주는지, 그리고 **결제 월을 모르는 연간 구독을 찍지 않고
 * 몇 건인지 말하는지**.
 */

const STORAGE_KEY = "subslash-storage";

const base = {
  currency: "KRW",
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const SUBSCRIPTIONS = [
  { ...base, id: "netflix", name: "넷플릭스", amount: 17000, billingDay: 15 },
  { ...base, id: "tving", name: "티빙", amount: 13900, billingDay: 15 },
  { ...base, id: "spotify", name: "스포티파이", amount: 10, currency: "USD", billingDay: 3 },
  {
    ...base,
    id: "notion",
    name: "노션 연간",
    amount: 120000,
    billingCycle: "yearly",
    billingDay: 8,
    // 결제 월을 적지 않았다. 어느 날에도 찍히면 안 된다.
  },
];

async function seed(page: Page) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    {
      key: STORAGE_KEY,
      value: JSON.stringify({
        state: { subscriptions: SUBSCRIPTIONS, usageLogs: [], accounts: [] },
        version: 1,
      }),
    },
  );
}

test.describe("결제 캘린더 (E2E)", () => {
  test("같은 날 결제를 모아 보여주고, 누르면 무엇이 얼마나 나가는지 말한다", async ({ page }) => {
    await seed(page);
    await page.goto("/dashboard");

    const calendar = page.getByRole("region", { name: "결제 캘린더" });
    await expect(calendar).toBeVisible({ timeout: 30_000 });

    // 15일에 두 건이 모인다.
    await calendar.getByRole("button", { name: /월 15일, 결제 2건/ }).click();
    const panel = calendar.getByText(/15일 결제/);
    await expect(panel).toBeVisible();
    await expect(calendar.getByText("넷플릭스")).toBeVisible();
    await expect(calendar.getByText("티빙")).toBeVisible();
    await expect(calendar.getByText("합계")).toContainText("₩30,900");

    // 결제가 없는 날은 누를 수 없다.
    await expect(calendar.getByRole("button", { name: /월 16일, 결제 없음/ })).toBeDisabled();
  });

  test("결제 월을 모르는 연간 구독은 어느 날에도 찍지 않고 몇 건인지 말한다", async ({ page }) => {
    await seed(page);
    await page.goto("/dashboard");

    const calendar = page.getByRole("region", { name: "결제 캘린더" });
    await expect(calendar).toBeVisible({ timeout: 30_000 });
    await expect(calendar.getByText(/결제 월 미설정 1건/)).toBeVisible();
    await expect(calendar.getByRole("link", { name: /연간 구독의 결제 월 적기/ })).toBeVisible();

    // 8일은 그 연간 구독의 날이지만, 결제 월을 모르므로 찍지 않는다.
    await expect(calendar.getByRole("button", { name: /월 8일, 결제 없음/ })).toBeVisible();
    await expect(calendar.getByText("노션 연간")).toHaveCount(0);
  });

  test("달을 넘겨도 월간 구독은 같은 날, 연간 미설정은 여전히 없다", async ({ page }) => {
    await seed(page);
    await page.goto("/dashboard");

    const calendar = page.getByRole("region", { name: "결제 캘린더" });
    await expect(calendar).toBeVisible({ timeout: 30_000 });

    await calendar.getByRole("button", { name: "다음 달" }).click();
    await expect(calendar.getByRole("button", { name: /월 15일, 결제 2건/ })).toBeVisible();
    await expect(calendar.getByText(/결제 월 미설정 1건/)).toBeVisible();

    // 다른 달로 갔으면 '이번 달'로 돌아오는 길이 생긴다.
    await calendar.getByRole("button", { name: "이번 달" }).click();
    await expect(calendar.getByRole("button", { name: "이번 달" })).toHaveCount(0);
  });
});
