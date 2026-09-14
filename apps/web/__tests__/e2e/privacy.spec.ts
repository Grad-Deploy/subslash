import { test, expect } from "@playwright/test";

test.describe("개인정보처리방침 (E2E)", () => {
  test("어느 화면에서든 푸터로 들어가고, 정하지 않은 연락처를 지어내지 않는다", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByRole("contentinfo").getByRole("link", { name: "개인정보처리방침" }).click({
      timeout: 30_000,
    });

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeVisible({
      timeout: 30_000,
    });
    // 서버로 가는 것이 무엇인지와, 국외 처리 위치를 적는다.
    await expect(page.getByText("일본 도쿄(AWS)")).toBeVisible();
    // 보호책임자는 정해지기 전까지 비어 있다고 말한다.
    await expect(
      page.getByText(/개인정보 보호책임자와 연락처를 아직 정하지 않았습니다/),
    ).toBeVisible();
  });

  test("가입 화면에서 방침을 볼 수 있다", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("main").getByRole("link", { name: "개인정보처리방침" }),
    ).toHaveAttribute("href", "/privacy", { timeout: 30_000 });
  });
});
