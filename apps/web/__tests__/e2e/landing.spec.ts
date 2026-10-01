import { test, expect } from "@playwright/test";

/**
 * 첫 화면(소개). 무엇을 하는지 화면으로 보여 주고, 웹에서 바로 쓰거나 앱을 받는 곳으로 보낸다. 앱은 아직 비공개
 * 테스트라 받을 곳이 없으므로 '준비 중' 표시만 있고 스토어 링크는 없다.
 */
test.describe("첫 화면 소개 (E2E)", () => {
  test("기능 소개와 웹 시작·앱 준비 중을 보여 주고, '바로 등록'은 없다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "SubSlash로 할 수 있는 것" })).toBeVisible({
      timeout: 30_000,
    });
    for (const title of [
      "결정할 구독만 골라 보여 줘요",
      "해지하는 곳까지 데려다줘요",
      "결제 메일로 구독을 찾아요",
      "해지로 지킨 돈이 쌓여요",
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
    // 캡처 이미지가 실제로 불러와진다.
    const images = page.locator('img[src^="/landing/"]');
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }

    // 앱은 '준비 중'만 알리고 스토어 링크를 만들지 않는다.
    await expect(page.getByText("안드로이드 앱 · Google Play 준비 중").first()).toBeVisible();
    await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "바로 등록" })).toHaveCount(0);

    await page.getByRole("link", { name: /웹에서 바로 시작하기/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
