import { test, expect } from "@playwright/test";

test.describe("비밀번호 재설정 (E2E)", () => {
  test("로그인 화면에서 재설정 화면으로 갈 수 있고, 형식이 틀린 주소는 보내지 않는다", async ({
    page,
  }) => {
    await page.goto("/login");
    const forgot = page.getByRole("link", { name: "비밀번호를 잊으셨나요?" });
    await expect(forgot).toBeVisible({ timeout: 30_000 });
    await forgot.click();
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 30_000 });

    await page.locator("#email").fill("sean@");
    await page.getByRole("button", { name: "재설정 메일 받기" }).click();
    await expect(page.getByText(/잘못된 이메일 형식입니다/)).toBeVisible();
  });

  test("토큰 없이 연 재설정 화면은 링크가 올바르지 않다고 알리고 다시 받는 길을 준다", async ({
    page,
  }) => {
    await page.goto("/reset-password");
    await expect(page.getByText("링크가 만료됐거나 올바르지 않습니다")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: "재설정 메일 다시 받기" })).toBeVisible();
  });
});
