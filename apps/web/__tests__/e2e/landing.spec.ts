import { test, expect } from "@playwright/test";

/**
 * 첫 화면(소개). 내려 읽으며 무엇을 하는지 알리고, 쓰는 것은 대시보드로 보낸다.
 * 앱은 아직 비공개 테스트라 받을 곳이 없으므로 '준비 중' 표시만 있고 스토어 링크는 없다.
 */
test.describe("첫 화면 소개 (E2E)", () => {
  test("계산기·기능·안심 칸을 내려 읽고, 등록은 이 화면에서 하지 않는다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/1회당 단가로/, {
      timeout: 30_000,
    });

    // 1회 단가 계산기. 횟수를 움직이면 단가가 바뀐다.
    // 화면이 막 그려진 직후에는 아직 손을 받지 않을 수 있어, 바뀔 때까지 다시 움직인다.
    await expect(async () => {
      await page.getByLabel("월 이용 횟수").fill("1");
      await expect(page.getByText("한 번 쓰려고 한 달 요금을 다 냈어요")).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 30_000 });

    for (const title of [
      /그 구독, ?한 달에 몇 번 써요/,
      /결정할 구독만/,
      /해지하는 곳까지/,
      /결제 메일로/,
      /해지로 지킨 돈이/,
      /내 구독 기록은/,
      /이번 달 구독/,
    ]) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
    // 캡처 이미지가 실제로 불러와진다. 넓은 화면은 '한눈에 보기'에 폰이 셋, 좁은 화면은 가운데 하나다.
    const images = page.locator('img[src^="/landing/"]:visible');
    expect(await images.count()).toBeGreaterThanOrEqual(4);
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
    // 첫 칸은 스크롤해야 뒤 장면의 버튼이 눌린다. 움직임 줄이기에서는 처음부터 보인다.
    await page.emulateMedia({ reducedMotion: "reduce" });
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

test.describe("첫 화면 소개 — 첫 칸의 장면 (E2E)", () => {
  test("결제 알림 장면에서 내려 읽으면 시작하기 칸으로 바뀐다", async ({ page }) => {
    await page.goto("/");
    const supportsScene = await page.evaluate(
      () =>
        CSS.supports("animation-timeline: view()") &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    test.skip(!supportsScene, "스크롤 애니메이션을 모르는 브라우저는 시작하기 칸만 보인다");

    const question = page.getByRole("heading", { name: "넷플릭스, 이번 달에 몇 번 봤어요?" });
    const scene = page.locator(".opening-b");
    await expect(question).toBeVisible({ timeout: 30_000 });
    // 처음에는 앞 장면이 위에 있고 시작하기 칸은 보이지 않는다.
    await expect(scene).toHaveCSS("opacity", "0");

    // 첫 칸 끝까지 내려가면 시작하기가 보이고 눌린다.
    await page.evaluate(() => {
      const opening = document.getElementById("top");
      if (opening)
        window.scrollTo(0, opening.offsetTop + opening.offsetHeight - window.innerHeight);
    });
    await expect(scene).toHaveCSS("opacity", "1");
    await scene.getByRole("link", { name: "웹에서 바로 시작하기 →" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
