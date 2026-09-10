import { test, expect } from "@playwright/test";

test.describe("Dashboard (E2E)", () => {
  test("랜딩 페이지 로드", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SubSlash/);
  });

  test("온보딩 표시", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /지금 바로 시작하기/ })).toBeVisible();
  });

  test("구독 등록 폼 표시", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /지금 바로 시작하기/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toBeVisible();
  });

  test("Escape 키로 모달 닫기", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /지금 바로 시작하기/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("모바일 하단 내비게이션 표시", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: /구독 관리/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /절약 현황/ })).toBeVisible();
  });

  test("샘플 데이터를 두 번 불러와도 중복 등록되지 않는다", async ({ page }) => {
    // These assertions follow a client-side navigation rather than a page load,
    // so on the first hit they also wait for the dev server to compile
    // /dashboard — which comfortably exceeds the default 5s expect timeout.
    // 샘플 3건은 모두 체크인 기록이 없으므로 행동 큐에 3줄로 올라온다.
    // 두 번 불러와도 6줄이 되지 않아야 한다.
    const dashboardHeading = page.getByRole("heading", { name: /지금 결정할 것 \(3\)/ });

    // The landing page's demo button stays available once subscriptions exist,
    // so it is the path where a repeat load could duplicate the sample set.
    await page.goto("/");
    await page.getByRole("button", { name: /샘플 데이터로 1초 체험/ }).click();
    await expect(dashboardHeading).toBeVisible({ timeout: 30_000 });

    await page.goto("/");
    await expect(page.getByText(/현재 \d+개의 구독이 등록되어 있습니다/)).toBeVisible();
    await page.getByRole("button", { name: /샘플 데이터로 1초 체험/ }).click();
    await expect(dashboardHeading).toBeVisible({ timeout: 30_000 });
  });
});
