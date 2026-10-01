import { test, expect } from "@playwright/test";

/**
 * 첫 화면(소개). 내려 읽으며 무엇을 하는지·웹과 앱 어디서 쓰는지를 알리고, 쓰는 것은 대시보드로 보낸다.
 * 앱은 아직 비공개 테스트라 받을 곳이 없으므로 '준비 중' 표시만 있고 스토어 링크는 없다.
 */
test.describe("첫 화면 소개 (E2E)", () => {
  test("계산기·기능·웹과 앱 소개를 내려 읽고, 등록은 이 화면에서 하지 않는다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/한 달에 몇 번 써요/, {
      timeout: 30_000,
    });

    // 1회 단가 계산기는 첫 칸에 있다. 횟수를 움직이면 단가가 바뀐다.
    // 화면이 막 그려진 직후에는 아직 손을 받지 않을 수 있어, 바뀔 때까지 다시 움직인다.
    await expect(async () => {
      await page.getByLabel("월 이용 횟수").fill("1");
      await expect(page.getByText("한 번 쓰려고 한 달 요금을 다 냈어요")).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 30_000 });

    for (const title of [
      /이렇게 써요/,
      /SubSlash로 할 수 있는 것/,
      /결정할 구독만/,
      /해지하는 곳까지/,
      /결제 메일로/,
      /해지로 지킨 돈이/,
      /웹에서도, 폰에서도/,
      /안심하고 쓰세요/,
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
    // 캡처 이미지가 실제로 불러와진다. 넓은 화면은 한자리에 머무는 폰 화면 하나에 네 장을 겹쳐 두고,
    // 좁은 화면은 차례로 쌓는다 — 보이는 쪽의 네 장을 본다.
    const images = page.locator('img[src^="/landing/"]:visible');
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
    // 등록은 대시보드에서 한다.
    await expect(page.getByRole("button", { name: /내 구독 등록하기/ })).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page
      .getByRole("link", { name: /웹에서 바로 시작하기/ })
      .last()
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("구독이 있으면 첫 버튼이 대시보드로 이어 준다", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "subslash-storage",
        JSON.stringify({
          state: {
            subscriptions: [
              {
                id: "netflix",
                name: "넷플릭스",
                amount: 17000,
                currency: "KRW",
                billingDay: 15,
                billingCycle: "monthly",
                category: "ott",
                status: "active",
                createdAt: "2026-01-01T00:00:00.000Z",
              },
            ],
            usageLogs: [],
            accounts: [],
          },
          version: 1,
        }),
      );
    });
    await page.goto("/");
    await page.getByRole("link", { name: "구독 중 1개 · 대시보드로 →" }).click({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("첫 화면 소개 — 넓은 화면 (E2E)", () => {
  test("기능 소개는 읽는 글에 따라 머무는 폰 화면이 바뀌고, 옆 막대로 옮겨 갈 수 있다", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "넓은 화면에서만 폰 화면이 머문다");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const current = page.locator('img[src^="/landing/"][aria-hidden="false"]');

    await page
      .getByRole("heading", { name: "결정할 구독만 골라 보여 줘요" })
      .scrollIntoViewIfNeeded();
    await expect(current).toHaveAttribute("src", "/landing/dashboard.png", { timeout: 30_000 });

    await page.getByRole("button", { name: "결제 메일로 구독을 찾아요" }).click();
    await expect(current).toHaveAttribute("src", "/landing/gmail-import.png");
    await expect(page.getByRole("button", { name: "결제 메일로 구독을 찾아요" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});
