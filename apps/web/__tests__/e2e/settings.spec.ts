import { test, expect, type Page } from "@playwright/test";

/**
 * 웹의 설정 화면(/settings). 예전 결제 알림 종이 있던 자리에 설정 아이콘을 두고, 앱과 같은 설정 화면을 연다.
 * '내 구독' 맨 아래에 있던 설정 목록은 이 화면으로 옮겼다.
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
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
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

test.describe("설정 화면 (E2E)", () => {
  test("넓은 화면은 상단 바의 설정 아이콘으로 연다", async ({ page, isMobile }) => {
    test.skip(isMobile, "아이콘은 sm 이상에서 보이고, 좁은 화면은 계정 메뉴에 있다");
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "설정" }).click({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "설정", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "설정" })).toHaveAttribute("aria-current", "page");
  });

  test("좁은 화면은 계정 메뉴의 '설정'으로 연다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "계정 메뉴" }).click({ timeout: 30_000 });
    await page
      .getByRole("menu", { name: "계정 메뉴" })
      .getByRole("menuitem", { name: "설정" })
      .click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "설정", exact: true })).toBeVisible();
  });

  test("설정 화면에서 백업과 전체 초기화를 하고, '내 구독'에는 설정 목록이 없다", async ({
    page,
  }) => {
    await seedOnce(page);
    await page.goto("/settings");
    await expect(page.getByText("이 브라우저에만 저장돼요")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /백업 · 계정 저장/ })).toBeVisible();
    await expect(page.getByRole("switch", { name: /다크 모드/ })).toBeVisible();

    await page.getByRole("button", { name: /전체 초기화/ }).click();
    await page.getByRole("button", { name: "모두 삭제" }).click();
    await expect(page.getByText("구독 기록을 모두 지웠어요")).toBeVisible();
    // 지울 구독이 없으면 초기화 줄도 없다.
    await expect(page.getByRole("button", { name: /전체 초기화/ })).toHaveCount(0);

    await page.goto("/subs");
    await expect(page.getByRole("heading", { name: "구독 관리", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /백업 · 계정 저장/ })).toHaveCount(0);
  });
});
