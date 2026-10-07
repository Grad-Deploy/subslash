import { test, expect } from "@playwright/test";

/**
 * 화면 언어(lib/i18n). 기기 언어를 따르고, 설정에서 고르면 이 기기에 남긴다. 다른 테스트는 한국어 기기로 열고
 * (playwright.config.ts), 여기서는 영어 기기로 연다.
 */
test.describe("화면 언어 (E2E)", () => {
  test.use({ locale: "en-US" });

  test("영어 기기는 영어로 보이고, 설정에서 한국어로 바꾸면 새로 열어도 남는다", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByRole("radio", { name: "한국어" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "설정" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "설정" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ko");

    // '기기 설정 따라'로 돌아가면 다시 영어다.
    await page.getByRole("radio", { name: "기기 설정 따라" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });

  test("하단 탭·푸터도 영어다", async ({ page, isMobile }) => {
    await page.goto("/settings");
    await expect(page.getByRole("link", { name: "Privacy policy" }).first()).toBeVisible();
    if (isMobile) {
      await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    } else {
      await expect(
        page
          .getByRole("navigation", { name: "Main menu" })
          .getByRole("link", { name: "Dashboard" }),
      ).toBeVisible();
    }
  });

  test("설정의 백업 칸도 영어다", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("button", { name: /Backup & account storage/ }).click({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Data backup" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save backup file" })).toBeVisible();
  });

  test("로그인·가입 화면과 입력 검사 문구도 영어다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
    await page.getByRole("button", { name: "Log in", exact: true }).click({ timeout: 30_000 });
    // 검사 함수는 서버와 같아 한국어 문장을 돌려준다. 화면은 그것을 영어로 바꿔 보인다.
    await expect(page.getByText("Enter your username or email.")).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("heading", { level: 1, name: "Sign up" })).toBeVisible();
    await page.getByLabel("Username").fill("AB");
    await expect(page.getByText("Usernames must be")).toBeVisible();
  });
});
