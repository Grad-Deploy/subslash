import { test, expect } from "@playwright/test";

test.describe("절약 공유 인증서 (E2E)", () => {
  test("새 링크는 지킨 돈을 머리 숫자로, 레벨을 지킨 돈으로 보여준다", async ({ page }) => {
    const params = new URLSearchParams({
      v: "2",
      saved: "17000",
      annual: "334800",
      count: "2",
      verified: "1",
    });
    params.append("name", "넷플릭스");
    params.append("name", "멜론");
    await page.goto(`/savings/share?${params.toString()}`);

    await expect(page.getByText("지킨 돈", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("₩17,000", { exact: true })).toBeVisible();
    await expect(page.getByText(/결제 멈춤 확인 1건/)).toBeVisible();
    await expect(page.getByText(/해지를 유지하면 1년에 ₩334,800을 아낍니다/)).toBeVisible();
    // 1년치 요금(₩334,800)이면 Lv.4였을 것이다.
    await expect(page.getByText("Lv.1 구독 새싹")).toBeVisible();
    await expect(page.getByText("2개 서비스")).toBeVisible();
  });

  test("예전 링크는 1년치 예상액을 '예상'으로 적고 레벨을 짐작하지 않는다", async ({ page }) => {
    await page.goto("/savings/share?saved=204000&count=2&names=넷플릭스,멜론");

    await expect(page.getByText("해지를 유지하면 1년에 아끼는 금액 (예상)")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("₩204,000", { exact: true })).toBeVisible();
    await expect(page.getByText(/예전 형식의 공유 링크입니다/)).toBeVisible();
    await expect(page.getByText("지킨 돈", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/Lv\./)).toHaveCount(0);
  });
});
