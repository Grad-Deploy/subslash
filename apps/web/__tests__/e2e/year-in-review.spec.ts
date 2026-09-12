import { test, expect } from "@playwright/test";

const won = (amount: number) => `₩${amount.toLocaleString("ko-KR")}`;

test.describe("올해 구독 결산 (E2E)", () => {
  test("지킨 돈, 해지한 구독, 지출 구성, 체크인 기준 가성비를 보여준다", async ({ page }) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const base = {
      currency: "KRW",
      billingDay: 15,
      billingCycle: "monthly",
      createdAt: `${year}-01-01T00:00:00`,
    };
    const state = {
      state: {
        subscriptions: [
          // 1월 1일 해지한 월 17,000원: 올해 이번 달까지 매달 지켰다.
          {
            ...base,
            id: "netflix",
            name: "넷플릭스",
            amount: 17000,
            category: "ott",
            status: "killed",
            killedAt: `${year}-01-01T00:00:00`,
          },
          {
            ...base,
            id: "youtube",
            name: "유튜브 프리미엄",
            amount: 14900,
            category: "ott",
            status: "active",
          },
          {
            ...base,
            id: "melon",
            name: "멜론",
            amount: 10900,
            category: "music",
            status: "active",
          },
        ],
        usageLogs: [
          {
            id: "l1",
            subscriptionId: "youtube",
            month: `${year}-01`,
            usageCount: 10,
            costPerUse: 1490,
            riskLevel: "green",
            checkedAt: `${year}-01-02T00:00:00`,
          },
          {
            id: "l2",
            subscriptionId: "melon",
            month: `${year}-01`,
            usageCount: 1,
            costPerUse: 10900,
            riskLevel: "red",
            checkedAt: `${year}-01-02T00:00:00`,
          },
        ],
        accounts: [],
      },
      version: 1,
    };
    await page.addInitScript(
      (value) => localStorage.setItem("subslash-storage", value),
      JSON.stringify(state),
    );

    // 절약 현황에서 결산으로 들어간다.
    await page.goto("/savings");
    await page.getByRole("link", { name: /올해 구독 결산 보기/ }).click();
    await expect(page).toHaveURL(/\/savings\/review/);
    await expect(page.getByRole("heading", { name: `📆 ${year}년 구독 결산` })).toBeVisible({
      timeout: 30_000,
    });

    // 결제일 기준으로 막은 결제다. 결제가 멈춘 것을 확인한 '지킨 돈'은 그 안의 한 줄이다.
    const defended = page.getByRole("region", { name: /해지로 막은 결제/ });
    await expect(defended.getByText(won(17000 * month), { exact: true })).toBeVisible();

    const killed = page.getByRole("region", { name: /해지한 구독 1개/ });
    await expect(killed.getByText(/넷플릭스/)).toBeVisible();

    const spend = page.getByRole("region", { name: "지금 구독 중인 서비스의 지출 구성" });
    // 소비 유형 카드도 "OTT 집중형"처럼 분야 이름을 쓴다. 카테고리 줄은 목록 항목이고
    // 소비 유형 카드는 목록 밖이므로, 목록 항목 가운데에서 찾는다.
    const categoryRows = spend.getByRole("listitem");
    await expect(categoryRows.filter({ hasText: "OTT" })).toBeVisible();
    await expect(categoryRows.filter({ hasText: "음악" })).toBeVisible();
    await expect(spend.getByText("소비 유형", { exact: true })).toBeVisible();

    const checkIns = page.getByRole("region", { name: /체크인으로 본 가성비/ });
    await expect(checkIns.getByText("1회당 가장 싸게 쓴 서비스")).toBeVisible();
    await expect(checkIns.getByText(/유튜브 프리미엄/).first()).toBeVisible();
    await expect(checkIns.getByText("1회당 ₩10,900 · 1회 이용")).toBeVisible();
  });

  test("지난해 결산은 끝난 해로 보여주고, 그때의 구독 구성은 지어내지 않는다", async ({ page }) => {
    const lastYear = new Date().getFullYear() - 1;
    await page.goto(`/savings/review?year=${lastYear}`);

    await expect(page.getByRole("heading", { name: `📆 ${lastYear}년 구독 결산` })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(`${lastYear}년 한 해 동안의 기록입니다.`)).toBeVisible();
    await expect(page.getByText(/지난 해의 구독 구성은 기록으로 남아 있지 않아/)).toBeVisible();
  });
});
