import { test, expect, type Page } from "@playwright/test";

/** 로그인 없이 결제 알림을 켜 둔(또는 확인 메일을 기다리는) 브라우저. */
function notifyOnly(verified: boolean): string {
  return JSON.stringify({
    state: {
      subscriptions: [],
      usageLogs: [],
      accounts: [],
      notify: {
        email: "me@gmail.com",
        syncToken: null,
        verified,
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
  await page.goto("/");
  await page.getByRole("button", { name: /내 구독 모두 계산하기/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: /목록에 없는 서비스 직접 입력/ })
    .click({ timeout: 30_000 });
  await dialog.getByRole("button", { name: /자세히 입력/ }).click();
  return dialog;
}

test.describe("결제 알림·연동 계정은 로그인했을 때만 (E2E)", () => {
  test.skip(({ isMobile }) => isMobile, "상단 바의 알림 아이콘은 sm 이상에서 보인다");

  test("로그인하지 않으면 알림 아이콘·연동 계정 메뉴·등록 창의 계정 칸이 없다", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "계정 메뉴" }).click({ timeout: 30_000 });
    const menu = page.getByRole("menu", { name: "계정 메뉴" });
    await expect(menu.getByRole("menuitem", { name: /로그인/ })).toBeVisible();
    await expect(menu.getByText("로그인하면 결제 알림과 연동 계정을 쓸 수 있어요.")).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /연동 계정 관리/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /결제 알림/ })).toHaveCount(0);

    const dialog = await openAddFormDetails(page);
    await expect(dialog.getByLabel("결제 수단")).toBeVisible();
    await expect(dialog.getByLabel("사용/로그인 계정")).toHaveCount(0);
  });

  test("로그인 없이 이미 알림을 켠 브라우저에는 알림 설정을 계속 보여준다", async ({ page }) => {
    // 숨기면 끄거나 바꿀 곳이 사라진다.
    await page.addInitScript((value) => {
      if (!localStorage.getItem("subslash-storage")) {
        localStorage.setItem("subslash-storage", value);
      }
    }, notifyOnly(true));
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "결제 알림 (켜짐)" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("로그인하면 알림 아이콘·연동 계정 메뉴·등록 창의 계정 칸이 보인다", async ({ page }) => {
    await mockLoggedIn(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: "결제 알림 (꺼짐)" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /계정 메뉴/ }).click();
    await expect(
      page
        .getByRole("menu", { name: "계정 메뉴" })
        .getByRole("menuitem", { name: /연동 계정 관리/ }),
    ).toBeVisible();

    const dialog = await openAddFormDetails(page);
    await expect(dialog.getByLabel("사용/로그인 계정")).toBeVisible();
  });
});
