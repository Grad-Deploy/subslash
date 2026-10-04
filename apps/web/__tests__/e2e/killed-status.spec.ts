import { test, expect, type Page } from "@playwright/test";

// Must match the `name` given to zustand's persist middleware in lib/store/index.ts.
const STORAGE_KEY = "subslash-storage";

const base = {
  currency: "KRW",
  billingDay: 15,
  billingCycle: "monthly",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** 8월 1일에 해지했고, 8월 15일 결제가 멈춘 것을 확인한 넷플릭스. */
const killedNetflix = {
  ...base,
  id: "netflix",
  name: "넷플릭스",
  amount: 17000,
  category: "ott",
  status: "killed",
  killedAt: "2026-08-01T03:00:00.000Z",
  killVerifiedAt: "2026-08-16T03:00:00.000Z",
};

const activeMelon = {
  ...base,
  id: "melon",
  name: "멜론",
  amount: 10900,
  category: "music",
  status: "active",
};

async function seedOnce(page: Page, subscriptions: Record<string, unknown>[]) {
  const value = JSON.stringify({
    state: { subscriptions, usageLogs: [], accounts: [] },
    version: 1,
  });
  await page.addInitScript(
    ([key, stored]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, stored);
    },
    [STORAGE_KEY, value] as const,
  );
}

async function readState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").state, STORAGE_KEY);
}

test.describe("해지한 구독의 상태 (E2E)", () => {
  // 첫 화면(소개)의 시작 버튼은 구독 중인 것만 센다. 해지한 것까지 세어 "N개"라고 하면 대시보드에는
  // 하나도 없을 수 있다. 예전 첫 화면의 '구독 중 N개 · 해지한 N개는 리포트에' 칸은 소개 페이지로 바뀌며
  // 없어졌다(a789213).
  test("첫 화면은 해지한 구독을 구독 중으로 세지 않는다", async ({ page }) => {
    await seedOnce(page, [killedNetflix]);
    await page.goto("/");

    // 버튼은 하이드레이션 전에는 늘 '시작하기'다. 계산기가 반응하면(살아난 뒤) 센 결과를 본다.
    await expect(async () => {
      await page.getByLabel("월 이용 횟수").fill("1");
      await expect(page.getByText("한 번 쓰려고 한 달 요금을 다 냈어요")).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 30_000 });
    const hero = page.getByRole("region", { name: /한 달에 몇 번 써요/ });
    await expect(hero.getByRole("link", { name: "웹에서 바로 시작하기 →" })).toBeVisible();
    await expect(page.getByText(/구독 중 \d+개/)).toHaveCount(0);
  });

  test("구독 중과 해지한 구독이 섞여 있으면 구독 중인 것만 센다", async ({ page }) => {
    await seedOnce(page, [killedNetflix, activeMelon]);
    await page.goto("/");

    const start = page.getByRole("link", { name: "구독 중 1개 · 대시보드로 →" });
    await expect(start).toBeVisible({ timeout: 30_000 });
    await start.click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  });

  test("해지한 구독의 상세에서는 다시 해지로 기록하거나 체크인할 수 없다", async ({ page }) => {
    await seedOnce(page, [killedNetflix]);
    await page.goto("/subs/detail?id=netflix");

    await expect(page.getByText("해지한 구독입니다.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /체크인 하기/ })).toHaveCount(0);

    await page.getByRole("button", { name: /해지 방법 보기/ }).click();
    const guide = page.getByRole("dialog");
    await expect(guide.getByText(/이미 해지한 구독으로 기록되어 있어요/)).toBeVisible();
    await expect(guide.getByRole("button", { name: "해지 완료했어요" })).toHaveCount(0);
    await guide.getByRole("button", { name: "닫기" }).last().click();

    // 해지일과 결제 멈춤 확인이 그대로다.
    const [sub] = (await readState(page)).subscriptions;
    expect(sub.killedAt).toBe(killedNetflix.killedAt);
    expect(sub.killVerifiedAt).toBe(killedNetflix.killVerifiedAt);
  });

  test("해지 전에 받은 체크인 메일 링크는 해지한 구독에 체크인을 남기지 않는다", async ({
    page,
  }) => {
    await seedOnce(page, [killedNetflix]);
    await page.goto("/check-in?sub=netflix&count=0");

    await expect(page.getByRole("heading", { name: "이미 해지한 구독입니다" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /해지 가이드 열기/ })).toHaveCount(0);

    const state = await readState(page);
    expect(state.usageLogs).toHaveLength(0);
    expect(state.subscriptions[0].status).toBe("killed");
    expect(state.subscriptions[0].killedAt).toBe(killedNetflix.killedAt);
  });
});
