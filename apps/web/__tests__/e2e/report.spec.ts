import { test, expect, type Page } from "@playwright/test";

/**
 * 구독 리포트(/report). 예전 '절약 현황'은 해지한 구독이 없으면 빈 화면이었다. 리포트는 해지하기
 * 전에도 지금 내는 돈과 1회 단가를 보여 준다.
 */

const STORAGE_KEY = "subslash-storage";

const NETFLIX = {
  id: "netflix",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 3,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};
const MELON = {
  ...NETFLIX,
  id: "melon",
  name: "Melon",
  amount: 11990,
  category: "music",
};

async function seed(page: Page, state: Record<string, unknown>) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify({ state, version: 1 }) },
  );
}

test.describe("구독 리포트 (E2E)", () => {
  test("구독이 없으면 등록하러 가는 길 하나만 보여준다", async ({ page }) => {
    await page.goto("/report");
    await expect(page.getByText("아직 등록한 구독이 없어요")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "구독 등록하러 가기" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("해지하지 않아도 한 달 지출과 1회 단가 순위를 보여준다", async ({ page }) => {
    await seed(page, {
      subscriptions: [NETFLIX, MELON],
      usageLogs: [
        {
          id: "l1",
          subscriptionId: "netflix",
          month: "2026-09",
          usageCount: 2,
          costPerUse: 8500,
          riskLevel: "yellow",
          checkedAt: new Date().toISOString(),
        },
      ],
      accounts: [],
    });
    await page.goto("/report");

    const summary = page.getByRole("region", { name: "지출 요약" });
    await expect(summary.getByText("₩28,990")).toBeVisible({ timeout: 30_000 });
    await expect(summary.getByText("2개")).toBeVisible();

    // 1회 단가를 아는 것이 먼저, 체크인 전인 것은 뒤에 온다.
    const rows = page.getByRole("listitem");
    await expect(rows.first()).toContainText("넷플릭스");
    await expect(rows.first()).toContainText("₩8,500");
    await expect(rows.nth(1)).toContainText("체크인 전");
  });

  test("하단 탭의 '리포트'는 절약 기록 화면에서도 켜져 있다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/savings");
    const tab = page.locator("nav").getByRole("link", { name: "리포트" });
    await expect(tab).toHaveClass(/text-primary/, { timeout: 30_000 });
  });

  test("AI가 닫혀 있어도 물어보기 칸이 있고, 추천 질문과 기기 규칙으로만 답하며 서버로 보내지 않는다", async ({
    page,
  }) => {
    test.skip(process.env.NEXT_PUBLIC_AI_ASK_TEST_OPEN === "true", "AI가 닫힌 서버에서만 확인한다");
    const asked: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/ask")) asked.push(req.url());
    });
    await seed(page, { subscriptions: [NETFLIX, MELON], usageLogs: [], accounts: [] });
    await page.goto("/report");

    const ask = page.getByRole("region", { name: "리포트에 물어보기" });
    await expect(ask.getByText(/서버나 AI로 보내지 않아요/)).toBeVisible({ timeout: 30_000 });

    // 추천 질문 버튼은 정해 둔 계산으로 바로 답한다.
    await ask.getByRole("button", { name: "한 달에 구독비 얼마 나가?" }).click();
    await expect(ask.getByText(/28,990/).first()).toBeVisible();

    // 기기 규칙이 모르는 질문은 서버로 보내지 않고 버튼을 다시 보여 준다.
    await ask.getByRole("textbox", { name: "리포트에 물어볼 질문" }).fill("오늘 날씨 어때?");
    await ask.getByRole("button", { name: "묻기", exact: true }).click();
    await expect(ask.getByText(/아직 알아듣지 못해요/)).toBeVisible();
    await expect(ask.getByRole("button", { name: "겹치는 구독 있어?" })).toBeVisible();

    expect(asked).toEqual([]);
  });
});
