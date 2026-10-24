import { test, expect } from "@playwright/test";

/**
 * 없는 주소. Next.js 기본 화면은 영어 한 줄("This page could not be found.")뿐이고 돌아갈 링크가 없었다
 * (운영 QA 2026-10-24).
 */
test.describe("없는 주소 (E2E)", () => {
  test("화면 언어로 알리고 처음·대시보드로 돌아가는 길을 둔다", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("This page could not be found.")).toHaveCount(0);

    await page.getByRole("link", { name: "대시보드로" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  });
});
