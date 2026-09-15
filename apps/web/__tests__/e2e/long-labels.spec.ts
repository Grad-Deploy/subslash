import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * 서비스 이름처럼 길이를 모르는 글자가 칸 밖으로 넘어가지 않는지.
 *
 * 해지 버튼은 "🚀 {이름} 해지 페이지 바로가기 (새 창)"처럼 이름을 문구에 넣는다. 기본 버튼은
 * 한 줄로만 그려서 목록에서 가장 긴 이름, 긴 결제 수단 이름, 띄어쓰기 없이 직접 적은 이름이 칸
 * 밖으로 넘어갔다. 버튼 하나만 보지 않고 화면의 모든 요소를 훑어, 다른 곳에서 넘치는 것도 잡는다.
 */

const LONG_PRESET = "Google AI Pro (Gemini Advanced)";
const LONG_CUSTOM = "우리동네헬스장프리미엄연간회원권자동결제구독서비스";

function seed(): string {
  const base = {
    amount: 29000,
    currency: "KRW",
    billingDay: 5,
    billingCycle: "monthly",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
  return JSON.stringify({
    state: {
      subscriptions: [
        {
          ...base,
          id: "gemini",
          name: LONG_PRESET,
          category: "ai",
          cancelUrl: "https://play.google.com/store/account/subscriptions",
          // 결제 수단 버튼 문구도 길다("Apple App Store 인앱결제 전용 정기결제 관리 열기").
          paymentMethod: "apple_iap",
          linkedAccountName: "구글 (averyveryverylongemailaddressforsubscriptions@gmail.com)",
        },
        {
          ...base,
          id: "custom",
          name: LONG_CUSTOM,
          category: "other",
          cancelUrl: "https://www.example-fitness-center-membership.co.kr/mypage/subscription",
          paymentMethod: "google_play",
        },
      ],
      usageLogs: [],
      accounts: [],
    },
    version: 1,
  });
}

async function seedOnce(page: Page) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("subslash-storage")) {
      localStorage.setItem("subslash-storage", value);
    }
  }, seed());
}

/**
 * 글자가 칸 밖으로 넘친 요소. 일부러 자르거나(overflow hidden·말줄임) 스크롤하는 칸은
 * 넘쳐도 보이지 않으므로 뺀다.
 */
async function overflowing(root: Locator): Promise<string[]> {
  return root.evaluate((container) => {
    const found: string[] = [];
    for (const node of container.querySelectorAll<HTMLElement>("*")) {
      if (node.clientWidth === 0) continue;
      if (getComputedStyle(node).overflowX !== "visible") continue;
      if (node.scrollWidth > node.clientWidth + 1) {
        const text = (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 70);
        found.push(`<${node.tagName.toLowerCase()}> ${text}`);
      }
    }
    return found;
  });
}

test.describe("긴 이름이 칸 밖으로 넘치지 않는다 (E2E)", () => {
  test.beforeEach(async ({ page }) => {
    await seedOnce(page);
    // 흔한 안드로이드 폰 중 좁은 폭.
    await page.setViewportSize({ width: 360, height: 780 });
  });

  for (const [id, name] of [
    ["gemini", LONG_PRESET],
    ["custom", LONG_CUSTOM],
  ] as const) {
    test(`구독 상세와 해지 안내·체크인 창 — ${name}`, async ({ page }) => {
      await page.goto(`/subs/detail?id=${id}`);
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
        timeout: 30_000,
      });
      expect(await overflowing(page.locator("main"))).toEqual([]);

      await page.getByRole("button", { name: /해지 방법 보기/ }).click();
      const guide = page.getByRole("dialog");
      await expect(guide.getByText("1단계 · 해지 화면 열기")).toBeVisible();
      expect(await overflowing(guide)).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);

      await page.getByRole("button", { name: /이용 횟수 체크인/ }).click();
      await page.getByRole("button", { name: "가성비 분석 결과 보기" }).click();
      const result = page.getByRole("dialog");
      await expect(result.getByRole("button", { name: "닫기" }).first()).toBeVisible();
      expect(await overflowing(result)).toEqual([]);
    });
  }

  test("내 구독 목록", async ({ page }) => {
    await page.goto("/subs");
    await expect(page.getByRole("link", { name: new RegExp(LONG_CUSTOM) })).toBeVisible({
      timeout: 30_000,
    });
    expect(await overflowing(page.locator("main"))).toEqual([]);
  });

  test("넓은 화면의 옆 칸 상세", async ({ page, isMobile }) => {
    test.skip(isMobile, "옆 칸은 1280px 이상에서만 열린다");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/subs?sub=gemini");
    const panel = page.getByRole("complementary", { name: "구독 상세" });
    await expect(panel.getByRole("heading", { name: LONG_PRESET, exact: true })).toBeVisible({
      timeout: 30_000,
    });
    expect(await overflowing(panel)).toEqual([]);
  });
});
