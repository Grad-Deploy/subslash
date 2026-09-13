import { test, expect } from "@playwright/test";

test.describe("새 구독 등록 — 서비스 고르기 (E2E)", () => {
  test("분류 탭으로 좁히고, 검색은 고른 분류와 상관없이 전체에서 찾는다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 구독 모두 계산하기/ }).click();

    const dialog = page.getByRole("dialog");
    const tabs = dialog.getByRole("group", { name: "서비스 분류" });
    await expect(tabs.getByRole("button", { name: /전체/ })).toHaveAttribute(
      "aria-pressed",
      "true",
      {
        timeout: 30_000,
      },
    );

    // AI 탭에서는 AI 서비스만 보인다.
    await tabs.getByRole("button", { name: /AI/ }).click();
    await expect(dialog.getByRole("button", { name: /GitHub Copilot/ })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /넷플릭스/ })).toHaveCount(0);

    // AI 탭을 켠 채 검색해도 OTT인 넷플릭스를 찾는다.
    await dialog.getByPlaceholder(/서비스 이름 검색/).fill("넷플");
    await expect(dialog.getByRole("button", { name: /넷플릭스/ })).toBeVisible();
    await expect(tabs.getByRole("button", { name: /AI/ })).toHaveAttribute("aria-pressed", "false");
  });
});
