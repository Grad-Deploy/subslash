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
    // 화면 모드는 설정 화면이 아니라 상단 바에 있다.
    await expect(page.getByRole("radiogroup", { name: "화면 모드" })).toHaveCount(0);

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

  test("화면 모드는 상단 바에서 자동·라이트·다크 중에 고르고, 자동으로 다시 돌아갈 수 있다", async ({
    page,
  }) => {
    // 기기는 다크 모드다.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/dashboard");
    const html = page.locator("html");
    const trigger = page.getByRole("button", { name: /^화면 모드/ });
    const menu = page.getByRole("menu", { name: "화면 모드" });

    // 고른 적이 없으면 자동(기기 설정)을 따른다.
    await expect(trigger).toHaveAccessibleName("화면 모드 (자동)", { timeout: 30_000 });
    await expect(html).toHaveClass(/\bdark\b/);

    await trigger.click();
    await expect(menu.getByRole("menuitemradio", { name: /자동/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await menu.getByRole("menuitemradio", { name: "라이트" }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
    await expect(trigger).toHaveAccessibleName("화면 모드 (라이트)");

    // 예전에는 한 번 고르면 기기 설정으로 돌아갈 길이 없었다.
    await menu.getByRole("menuitemradio", { name: /자동/ }).click();
    await expect(html).toHaveClass(/\bdark\b/);
    expect(await page.evaluate(() => localStorage.getItem("subslash-theme"))).toBeNull();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);

    // 기기 설정을 따르는 동안에는 기기가 바뀌면 화면도 바뀐다.
    await page.emulateMedia({ colorScheme: "light" });
    await expect(html).not.toHaveClass(/\bdark\b/);

    // 계정 메뉴에는 화면 모드가 없다.
    await page.getByRole("button", { name: "계정 메뉴" }).click();
    const accountMenu = page.getByRole("menu", { name: "계정 메뉴" });
    await expect(accountMenu.getByRole("menuitem", { name: /다크 모드|라이트 모드/ })).toHaveCount(
      0,
    );
  });
});
