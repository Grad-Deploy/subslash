import { test, expect } from "@playwright/test";

const won = (amount: number) => `₩${amount.toLocaleString("ko-KR")}`;

test.describe("절약 현황 월별 방어액 (E2E)", () => {
  test("올해 달별 방어액을 지킨 달과 예정으로 나눠 보여준다", async ({ page }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const base = {
      currency: "KRW",
      category: "ott",
      status: "killed",
      createdAt: `${year}-01-01T00:00:00`,
    };

    // 1월 1일에 해지한 월 17,000원 구독: 올해 모든 달의 결제일이 해지 뒤라 달마다 방어된다.
    // 결제 월을 모르는 연간 구독: 어느 달에도 넣지 않고 따로 알린다.
    const state = {
      state: {
        subscriptions: [
          {
            ...base,
            id: "monthly",
            name: "넷플릭스",
            amount: 17000,
            billingDay: 15,
            billingCycle: "monthly",
            killedAt: `${year}-01-01T00:00:00`,
          },
          {
            ...base,
            id: "yearly-no-month",
            name: "결제 월 모름",
            amount: 50000,
            billingDay: 1,
            billingCycle: "yearly",
            killedAt: `${year}-01-01T00:00:00`,
          },
        ],
        usageLogs: [],
        accounts: [],
      },
      version: 1,
    };
    await page.addInitScript((value) => {
      localStorage.setItem("subslash-storage", value);
    }, JSON.stringify(state));

    await page.goto("/savings");
    const chart = page.locator("section", { hasText: "월별 방어액" });
    await expect(chart).toBeVisible({ timeout: 30_000 });

    // 이번 달까지는 지킨 돈, 남은 달은 예정이다. 연말까지 더한 금액을 지킨 돈으로 보이지 않는다.
    await expect(chart.locator("dd").nth(0)).toHaveText(won(17000 * month));
    await expect(chart.locator("dd").nth(1)).toHaveText(won(17000 * (12 - month)));

    await expect(chart.getByText(/결제 월을 모르는 연간 구독 1건/)).toBeVisible();

    // 막대 색만으로 구분하지 않도록 표로도 볼 수 있다.
    await chart.getByText("표로 보기").click();
    await expect(chart.locator("tbody tr")).toHaveCount(12);
    await expect(chart.locator("tbody tr").nth(month - 1)).toContainText("지킴");
    if (month < 12) {
      await expect(chart.locator("tbody tr").nth(month)).toContainText("예정");
    }
  });
});
