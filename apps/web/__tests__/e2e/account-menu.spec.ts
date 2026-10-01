import { test, expect, type Page } from "@playwright/test";

/**
 * 결제 알림 메일과 연동 계정 관리를 걷어낸 뒤의 계정 메뉴와 등록 창.
 *
 * 알림을 켜 두었던 브라우저에는 예전 알림 설정(`notify`)이 저장소에 남아 있다. 그래도 알림 아이콘이
 * 다시 나타나면 끌 수도 바꿀 수도 없는 메뉴가 생긴다.
 */
function oldNotifyBrowser(): string {
  return JSON.stringify({
    state: {
      subscriptions: [],
      usageLogs: [],
      accounts: [],
      notify: {
        email: "me@gmail.com",
        syncToken: "old-token",
        verified: true,
        reminderDays: 3,
        lastSyncedAt: null,
        calendarUrl: null,
      },
    },
    version: 1,
  });
}

/** 서버 세션 대신 /api/auth/me 응답만 바꿔 로그인한 화면을 본다. */
async function mockLoggedIn(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        account: {
          id: "a1",
          username: "tester",
          email: "tester@gmail.com",
          age: null,
          gender: null,
          emailVerified: true,
          createdAt: "2026-09-01T00:00:00.000Z",
        },
      },
    }),
  );
}

/** 새 구독 등록 창을 직접 입력으로 열고 '자세히 입력'을 펼친다. */
async function openAddFormDetails(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "더 보기", exact: true }).click({ timeout: 30_000 });
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: /목록에 없는 서비스 직접 입력/ })
    .click({ timeout: 30_000 });
  await dialog.getByRole("button", { name: /자세히 입력/ }).click();
  return dialog;
}

test.describe("결제 알림 메일·연동 계정 관리를 걷어낸 뒤 (E2E)", () => {
  test("로그인하지 않아도 등록 창에 '가입한 계정' 칸이 있고, 알림·연동 계정 메뉴는 없다", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "계정 메뉴" }).click({ timeout: 30_000 });
    const menu = page.getByRole("menu", { name: "계정 메뉴" });
    await expect(menu.getByRole("menuitem", { name: /로그인/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /연동 계정 관리/ })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: /결제 알림/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /결제 알림/ })).toHaveCount(0);

    const dialog = await openAddFormDetails(page);
    await expect(dialog.getByLabel("가입한 계정")).toBeVisible();
  });

  test("로그인해도 알림 아이콘·연동 계정 메뉴는 없다", async ({ page }) => {
    await mockLoggedIn(page);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /계정 메뉴/ }).click({ timeout: 30_000 });
    const menu = page.getByRole("menu", { name: "계정 메뉴" });
    await expect(menu.getByRole("menuitem", { name: /내 정보/ })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /연동 계정 관리/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /결제 알림/ })).toHaveCount(0);
  });

  test("예전에 알림을 켜 둔 브라우저에도 알림 아이콘이 다시 나타나지 않는다", async ({ page }) => {
    await page.addInitScript((value) => {
      if (!localStorage.getItem("subslash-storage")) {
        localStorage.setItem("subslash-storage", value);
      }
    }, oldNotifyBrowser());
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "계정 메뉴" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /결제 알림/ })).toHaveCount(0);
  });
});
