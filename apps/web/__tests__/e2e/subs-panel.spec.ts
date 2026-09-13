import { test, expect, type Page } from "@playwright/test";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 등록 순서: 넷플릭스 → 유튜브 프리미엄 → 노션. 카드 보기의 ↑↓도 이 순서를 따른다. */
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
        { ...base, id: "notion", name: "노션", amount: 12000, billingDay: dayIn(20) },
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

test.describe("내 구독 옆 칸 상세 (E2E)", () => {
  test.skip(({ isMobile }) => isMobile, "옆 칸은 1280px 이상에서만 열린다");

  test("이름을 누르면 옆 칸에 상세가 열리고, 주소·뒤로 가기·↑↓와 함께 움직인다", async ({
    page,
  }) => {
    await seedOnce(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/subs");

    const panel = page.getByRole("complementary", { name: "구독 상세" });
    const panelTitle = (name: string) =>
      panel.getByRole("heading", { level: 2, name, exact: true });
    await expect(panel.getByText("구독을 고르면 여기에 자세히 보여줍니다")).toBeVisible({
      timeout: 30_000,
    });

    // 페이지를 옮기지 않고 옆 칸에 연다. 주소에 남아 새로고침·공유가 된다.
    await page.getByRole("link", { name: /넷플릭스/ }).click();
    await expect(page).toHaveURL(/\/subs\?sub=netflix$/);
    await expect(panelTitle("넷플릭스")).toBeVisible();

    await page.getByRole("link", { name: /유튜브 프리미엄/ }).click();
    await expect(panelTitle("유튜브 프리미엄")).toBeVisible();

    // 뒤로 가기는 직전에 보던 구독으로 돌아간다.
    await page.goBack();
    await expect(panelTitle("넷플릭스")).toBeVisible();

    // 고른 뒤에는 ↑↓로 목록 순서대로 넘긴다.
    await page.keyboard.press("ArrowDown");
    await expect(panelTitle("유튜브 프리미엄")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(panelTitle("노션")).toBeVisible();
    await page.keyboard.press("ArrowUp");
    await expect(panelTitle("유튜브 프리미엄")).toBeVisible();

    await panel.getByRole("button", { name: /닫기/ }).click();
    await expect(page).toHaveURL(/\/subs$/);
    await expect(panel.getByText("구독을 고르면 여기에 자세히 보여줍니다")).toBeVisible();
  });

  test("옆 칸에서 구독을 지우면 목록의 다음 구독으로 넘어간다", async ({ page }) => {
    await seedOnce(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/subs?sub=netflix");

    const panel = page.getByRole("complementary", { name: "구독 상세" });
    await expect(
      panel.getByRole("heading", { level: 2, name: "넷플릭스", exact: true }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await panel.getByRole("button", { name: "삭제", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "삭제", exact: true }).click();

    await expect(page).toHaveURL(/\/subs\?sub=youtube$/);
    await expect(
      panel.getByRole("heading", { level: 2, name: "유튜브 프리미엄", exact: true }),
    ).toBeVisible();
  });

  test("좁은 화면에서 옆 칸 주소로 오면 상세 페이지로 보낸다", async ({ page }) => {
    await seedOnce(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/subs?sub=netflix");
    await expect(page).toHaveURL(/\/subs\/netflix$/, { timeout: 30_000 });
  });
});
