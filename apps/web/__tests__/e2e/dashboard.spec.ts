import { test, expect } from "@playwright/test";

test.describe("Dashboard (E2E)", () => {
  test("랜딩 페이지 로드", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SubSlash/);
  });

  test("온보딩 표시", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /내 구독 모두 계산하기/ })).toBeVisible();
  });

  test("구독 등록 폼 표시", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 구독 모두 계산하기/ }).click();

    // 새 등록은 서비스부터 고른다. 이름·금액 칸은 고른 다음에 나온다.
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByPlaceholder(/서비스 이름 검색/)).toBeVisible();
    await expect(dialog.getByRole("button", { name: /넷플릭스/ })).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toHaveCount(0);

    await dialog.getByRole("button", { name: /목록에 없는 서비스 직접 입력/ }).click();
    await expect(dialog.locator('input[name="name"]')).toBeVisible();
  });

  test("Escape 키로 모달 닫기", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 구독 모두 계산하기/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("모바일 하단 내비게이션 표시", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: /구독 관리/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /절약 현황/ })).toBeVisible();
  });

  test("샘플 체험은 내 구독과 섞이지 않고, 끝내면 내 구독으로 돌아온다", async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("subslash-storage")) return;
      localStorage.setItem(
        "subslash-storage",
        JSON.stringify({
          state: {
            subscriptions: [
              {
                id: "real-notion",
                name: "내 노션",
                amount: 16800,
                currency: "KRW",
                billingDay: 5,
                billingCycle: "monthly",
                category: "other",
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
    await page.getByRole("button", { name: /샘플 데이터로 1초 체험/ }).click();
    const banner = page.getByRole("status").filter({ hasText: "샘플로 체험하는 중입니다." });
    await expect(banner).toBeVisible({ timeout: 30_000 });
    // 샘플 3건만 행동 큐에 오른다(체크인 기록이 없다). 내 노션은 섞이지 않는다.
    await expect(page.getByRole("heading", { name: /지금 결정할 것 \(3\)/ })).toBeVisible({
      timeout: 30_000,
    });
    // 저장소에는 체험 중에도 실제 기록만 있다.
    const stored = await page.evaluate(() => localStorage.getItem("subslash-storage") ?? "");
    expect(stored).toContain("내 노션");
    expect(stored).not.toContain("쿠팡 와우 멤버십");

    // 새로고침하면 체험이 끝나므로 화면 안의 링크로 옮긴다.
    await page.locator('a[href="/subs"]:visible').first().click();
    await expect(page.getByRole("link", { name: /쿠팡 와우 멤버십/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: /내 노션/ })).toHaveCount(0);

    await banner.getByRole("button", { name: "체험 끝내기" }).click();
    await expect(banner).toHaveCount(0);
    await expect(page.getByRole("link", { name: /내 노션/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /쿠팡 와우 멤버십/ })).toHaveCount(0);
  });

  test("체험 중에 새로고침하면 샘플이 사라진다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /샘플 데이터로 1초 체험/ }).click();
    await expect(page.getByText("샘플로 체험하는 중입니다.")).toBeVisible({ timeout: 30_000 });

    await page.reload();
    // 구독이 하나도 없을 때만 보이는 버튼이 다시 나온다 — 샘플이 저장되지 않았다.
    await expect(page.getByRole("button", { name: /샘플 불러오기/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("샘플로 체험하는 중입니다.")).toHaveCount(0);
  });
});
