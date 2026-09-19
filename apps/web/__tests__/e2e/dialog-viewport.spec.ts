import { test, expect, type Page } from "@playwright/test";

/**
 * 창(Dialog)이 화면 밖으로 잘리지 않고, 닫을 방법이 늘 보이는지.
 *
 * 구독 정보 수정처럼 긴 폼은 창이 화면보다 높다. 그때 창 자체가 스크롤하면 오른쪽 위 닫기 버튼이
 * 내용과 함께 밀려 올라가 사라졌다. iOS Safari에서는 `vh`가 주소창을 감춘 가장 큰 높이라 창의
 * 위아래까지 화면 밖으로 나갔다. 눈으로 볼 수 없으니 좌표로 잰다.
 */

const STORAGE_KEY = "subslash-storage";

const NETFLIX = {
  id: "netflix",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 25,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function seed(page: Page) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    {
      key: STORAGE_KEY,
      value: JSON.stringify({
        state: { subscriptions: [NETFLIX], usageLogs: [], accounts: [] },
        version: 1,
      }),
    },
  );
}

/** 요소가 화면 안에 온전히 들어와 있는지. */
async function isFullyVisible(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { found: false, top: 0, bottom: 0, height: 0 };
    const rect = el.getBoundingClientRect();
    return {
      found: true,
      top: rect.top,
      bottom: rect.bottom,
      height: window.innerHeight,
    };
  }, selector);
}

test.describe("창이 화면 밖으로 잘리지 않는다 (E2E)", () => {
  test("좁고 낮은 화면에서도 구독 정보 수정 창의 닫기 버튼이 보인다", async ({ page }) => {
    // 주소창까지 있는 휴대폰만 한 높이. 여기서 긴 폼이 화면을 넘긴다.
    await page.setViewportSize({ width: 390, height: 600 });
    await seed(page);
    await page.goto("/subs/detail?id=netflix");

    await page.getByRole("button", { name: /정보 수정/ }).click({ timeout: 30_000 });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // 창의 위가 화면 위로 잘려 나가지 않는다.
    const box = await isFullyVisible(page, '[role="dialog"]');
    expect(box.found).toBe(true);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(box.height + 1);

    // 닫기 버튼이 화면 안에 있고, 눌러서 닫힌다.
    const close = dialog.getByRole("button", { name: "Close" });
    await expect(close).toBeInViewport();
    await close.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("폼을 끝까지 내려도 닫기 버튼이 따라 사라지지 않는다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await seed(page);
    await page.goto("/subs/detail?id=netflix");

    await page.getByRole("button", { name: /정보 수정/ }).click({ timeout: 30_000 });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // 창 안에서 스크롤되는 칸을 찾아 끝까지 내린다. 창 자체가 스크롤하던 예전 구조에서도
    // 같은 코드가 동작하도록 창까지 후보에 넣는다 — 그래야 이 테스트가 그때를 잡는다.
    const scrolled = await page.evaluate(() => {
      const panel = document.querySelector('[role="dialog"]');
      if (!panel) return 0;
      const candidates = [panel, ...Array.from(panel.querySelectorAll("*"))].filter(
        (el) => el.scrollHeight > el.clientHeight + 1,
      );
      let moved = 0;
      for (const el of candidates) {
        el.scrollTop = el.scrollHeight;
        moved = Math.max(moved, el.scrollTop);
      }
      return moved;
    });

    // 실제로 내려가지 않았으면 이 테스트는 아무것도 확인하지 못한 것이다.
    expect(scrolled).toBeGreaterThan(0);

    await expect(dialog.getByRole("button", { name: "Close" })).toBeInViewport();
  });
});
