import { test, expect } from "@playwright/test";

test.describe("연말 결산 공유 카드 (E2E)", () => {
  test("링크만으로 결산 숫자와 소비 유형을 보여준다", async ({ page }) => {
    const params = new URLSearchParams({
      v: "1",
      y: "2025",
      done: "1",
      blocked: "204000",
      saved: "153000",
      killed: "2",
      type: "focused",
      cat: "ott",
      pct: "62",
    });
    params.append("name", "넷플릭스");
    params.append("name", "멜론");
    await page.goto(`/savings/review/share?${params.toString()}`);

    await expect(page.getByText("SubSlash 2025년 구독 결산")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("₩204,000", { exact: true })).toBeVisible();
    await expect(page.getByText(/지킨 돈 ₩153,000/)).toBeVisible();
    await expect(page.getByText("2개 서비스")).toBeVisible();
    await expect(page.getByText(/OTT 집중형/)).toBeVisible();
    await expect(page.getByText("구독 지출의 62%가 OTT에 모여 있습니다.")).toBeVisible();
  });

  test("형식이 틀린 링크는 숫자를 지어내지 않고 안내만 한다", async ({ page }) => {
    await page.goto("/savings/review/share?y=abc&blocked=5000");

    await expect(page.getByText("올바르지 않은 결산 링크입니다")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/₩/)).toHaveCount(0);
  });
});
