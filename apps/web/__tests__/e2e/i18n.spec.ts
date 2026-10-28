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

  // 페이지의 제목은 서버가 한국어로 정한다. 예전에는 영어 화면에서도 탭이 '로그인 · SubSlash'였다.
  test("탭 제목도 화면 언어를 따르고, 화면을 옮겨도 남는다", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle("Log in · SubSlash");
    await page.goto("/settings");
    await expect(page).toHaveTitle("Settings · SubSlash");
    await page.getByRole("radio", { name: "한국어" }).click();
    await expect(page).toHaveTitle("설정 · SubSlash");
    await page.getByRole("radio", { name: "기기 설정 따라" }).click();
    await expect(page).toHaveTitle("Settings · SubSlash");
  });

  // 서비스 목록의 해지 안내는 확인한 원문이라 옮기지 않는다. 대신 원문이라고 밝히고 한국어로 읽게 한다.
  test("번역하지 않은 해지 안내는 원문(한국어)이라고 적는다", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "subslash-storage",
        JSON.stringify({
          state: {
            subscriptions: [
              {
                id: "sub1",
                name: "넷플릭스",
                amount: 17000,
                currency: "KRW",
                billingDay: 15,
                billingCycle: "monthly",
                category: "ott",
                status: "active",
                createdAt: "2026-09-01T00:00:00.000Z",
                cancelUrl: "https://www.netflix.com/cancelplan",
                cancelGuide: "1. 계정 메뉴로 이동\n2. 멤버십 해지 클릭",
              },
            ],
            usageLogs: [],
            accounts: [],
          },
          version: 0,
        }),
      );
    });
    await page.goto("/subs/detail?id=sub1");
    const steps = page.getByText("멤버십 해지 클릭");
    await expect(steps).toBeVisible({ timeout: 30_000 });
    await expect(steps).toHaveAttribute("lang", "ko");
    await expect(page.getByText(/^Original \(Korean\), not translated/)).toBeVisible();
  });

  // 서비스 목록의 요금은 한국에서 확인한 값이라 언어를 바꿔도 옮기지 않는다. 대신 그렇다고 밝힌다.
  test("목록 요금은 한국에서 확인한 값이라고 적고, 한국어 화면에서는 적지 않는다", async ({
    page,
  }) => {
    await page.goto("/subs");
    const note = page.getByText("Prices are as checked for Korea.", { exact: false });
    await expect(note.first()).toBeVisible({ timeout: 30_000 });

    await page.goto("/settings");
    await page.getByRole("radio", { name: "한국어" }).click();
    await page.goto("/subs");
    await expect(page.getByRole("heading", { level: 1, name: "구독 관리" })).toBeVisible();
    await expect(page.getByText("요금은 한국에서 확인한 값이에요.", { exact: false })).toHaveCount(
      0,
    );
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

// 오프라인 화면은 JS 없이 CSS로 언어를 고른다. 예전에는 lang=en일 때만 영어라, 일본어 기기에 한국어가 나왔다.
test.describe("오프라인 화면의 언어 (E2E)", () => {
  test.use({ locale: "ja-JP" });

  test("번역이 없는 언어의 기기에서는 한국어가 아니라 영어로 보인다", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.getByRole("heading", { level: 1, name: "You're offline" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "지금은 오프라인입니다" }),
    ).toBeHidden();
  });
});
