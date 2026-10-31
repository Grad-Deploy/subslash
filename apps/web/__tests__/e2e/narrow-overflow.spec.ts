import { test, expect, type Page } from "@playwright/test";

/** 페이지 폭은 휴대폰 폭을 넘지 않아야 한다. 문구가 긴 언어와 공백 없는 이름에서 옆으로 밀린 적이 있다. */
async function expectNoSideScroll(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);
}

test.describe("좁은 화면의 가로 넘침 (E2E)", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const locale of ["ko", "de", "fr"]) {
    test(`첫 화면이 넘치지 않는다 (${locale})`, async ({ page }) => {
      await page.addInitScript((l) => localStorage.setItem("subslash-locale", l), locale);
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expectNoSideScroll(page);
    });
  }

  test("공백 없는 긴 이름의 구독이 있어도 대시보드가 넘치지 않는다", async ({ page }) => {
    await page.addInitScript(() => {
      const name = "A".repeat(70);
      localStorage.setItem(
        "subslash-storage",
        JSON.stringify({
          state: {
            subscriptions: [
              {
                id: "long",
                name,
                amount: 5000,
                currency: "KRW",
                billingCycle: "monthly",
                billingDay: 8,
                category: "ott",
                status: "active",
                paymentMethod: "card",
                createdAt: "2026-01-01T00:00:00.000Z",
              },
            ],
            usageLogs: [],
          },
          version: 1,
        }),
      );
    });
    await page.goto("/dashboard");
    await expect(page.getByText("A".repeat(70)).first()).toBeVisible();
    await expectNoSideScroll(page);
  });
});
