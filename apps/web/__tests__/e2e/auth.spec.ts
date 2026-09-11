import { test, expect } from "@playwright/test";

test.describe("계정 (E2E)", () => {
  test("가입 폼은 나이·성별을 묻지 않고, 만 14세 확인만 필수로 받는다", async ({ page }) => {
    await page.goto("/signup");

    const over14 = page.getByLabel(/만 14세 이상입니다/);
    await expect(over14).toBeVisible({ timeout: 30_000 });
    await expect(over14).not.toBeChecked();
    await expect(page.locator("#age")).toHaveCount(0);
    await expect(page.locator("#gender")).toHaveCount(0);

    // 확인하지 않고 제출하면 서버까지 가지 않고 그 자리에서 알려준다.
    await page.getByRole("button", { name: "회원가입" }).click();
    await expect(page.getByText("만 14세 이상인지 확인해주세요.")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("로그인하지 않고 내 정보에 오면, 로그인 없이도 쓸 수 있다고 안내한다", async ({ page }) => {
    await page.goto("/me");

    await expect(page.getByText(/로그인한 계정에만 있는 화면입니다/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: "로그인하기" })).toBeVisible();
  });
});
