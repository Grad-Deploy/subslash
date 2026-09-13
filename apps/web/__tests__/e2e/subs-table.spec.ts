import { test, expect, type Page } from "@playwright/test";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 결제일을 아는 월간 구독 둘(하나는 체크인 기록이 있다)과, 결제 월을 모르는
 * 연간 구독 하나.
 */
function seed(): string {
  const now = Date.now();
  const dayIn = (days: number) => new Date(now + days * DAY_MS).getDate();
  const base = {
    currency: "KRW",
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  return JSON.stringify({
    state: {
      subscriptions: [
        { ...base, id: "netflix", name: "넷플릭스", amount: 17000, billingDay: dayIn(5) },
        { ...base, id: "youtube", name: "유튜브 프리미엄", amount: 14900, billingDay: dayIn(9) },
        {
          ...base,
          id: "notion",
          name: "노션",
          amount: 96000,
          billingDay: 3,
          billingCycle: "yearly",
          category: "productivity",
        },
      ],
      usageLogs: [
        {
          id: "log-1",
          subscriptionId: "youtube",
          month: "2026-09",
          usageCount: 4,
          costPerUse: 3725,
          riskLevel: "green",
          checkedAt: new Date(now - 3 * DAY_MS).toISOString(),
        },
      ],
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

test.describe("내 구독 표 보기 (E2E)", () => {
  test.skip(({ isMobile }) => isMobile, "표 보기는 md 이상에서만 고를 수 있다");

  test("표로 바꾸면 모르는 값은 지어내지 않고, 정렬해도 맨 뒤에 둔다", async ({ page }) => {
    await seedOnce(page);
    await page.goto("/subs");

    await page.getByRole("button", { name: "표", exact: true }).click({ timeout: 30_000 });
    const table = page.getByRole("table");
    await expect(table).toBeVisible();

    // 체크인이 없으면 1회 단가를 채우지 않는다.
    await expect(table.getByRole("row", { name: /넷플릭스/ })).toContainText("체크인 기록 없음");
    await expect(table.getByRole("row", { name: /유튜브 프리미엄/ })).toContainText("₩3,725");
    // 결제 월을 모르는 연간 구독에 D-day를 만들지 않는다.
    await expect(table.getByRole("row", { name: /노션/ })).toContainText("결제 월 미설정");

    // 다음 결제 순(기본)에서도, 방향을 뒤집어도 날짜를 모르는 줄은 맨 뒤다.
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toContainText("넷플릭스");
    await expect(rows.last()).toContainText("노션");
    await table.getByRole("button", { name: /다음 결제/ }).click();
    await expect(rows.first()).toContainText("유튜브 프리미엄");
    await expect(rows.last()).toContainText("노션");

    // 고른 보기는 새로고침 뒤에도 남는다.
    await page.reload();
    await expect(page.getByRole("table")).toBeVisible({ timeout: 30_000 });
  });
});
