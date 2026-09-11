import { test, expect } from "@playwright/test";

/** 넷플릭스 월 17,000원을 두 번 체크인해 둔 저장소. */
function seed(logs: Array<{ usageCount: number; costPerUse: number; checkedAt: string }>) {
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
      usageLogs: logs.map((l, index) => ({
        id: `log-${index}`,
        subscriptionId: "netflix",
        month: l.checkedAt.slice(0, 7),
        riskLevel: "yellow",
        ...l,
      })),
      accounts: [],
    },
    version: 1,
  });
}

test.describe("구독 상세 체크인 근거 (E2E)", () => {
  test("최근 평균, 마지막 1회당 비용, 직전 대비 변화를 보여준다", async ({ page }) => {
    const state = seed([
      { usageCount: 6, costPerUse: 17000 / 6, checkedAt: "2026-08-01T00:00:00.000Z" },
      { usageCount: 2, costPerUse: 8500, checkedAt: "2026-09-01T00:00:00.000Z" },
    ]);
    await page.addInitScript((value) => localStorage.setItem("subslash-storage", value), state);

    await page.goto("/subs/netflix");
    const evidence = page.getByRole("region", { name: "체크인 근거" });
    await expect(evidence).toBeVisible({ timeout: 30_000 });

    await expect(evidence.getByText("최근 2회 체크인 평균")).toBeVisible();
    await expect(evidence.getByText("4회", { exact: true })).toBeVisible();
    await expect(evidence.getByText("₩8,500")).toBeVisible();
    await expect(evidence.getByText("4회 줄었음")).toBeVisible();
    await expect(evidence.getByText("1회당 ₩5,667 비싸짐")).toBeVisible();
  });

  test("체크인이 한 번뿐이면 변화 대신 '비교할 기록 부족'이라고 한다", async ({ page }) => {
    const state = seed([
      { usageCount: 4, costPerUse: 4250, checkedAt: "2026-09-01T00:00:00.000Z" },
    ]);
    await page.addInitScript((value) => localStorage.setItem("subslash-storage", value), state);

    await page.goto("/subs/netflix");
    const evidence = page.getByRole("region", { name: "체크인 근거" });
    await expect(evidence).toBeVisible({ timeout: 30_000 });
    await expect(evidence.getByText("비교할 기록 부족")).toBeVisible();
  });
});
