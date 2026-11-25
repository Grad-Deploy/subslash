import { test, expect, type BrowserContext } from "@playwright/test";

const GIB = 1024 ** 3;

/** 구글 원 구독 하나를 둔 저장소. */
function seed(planId: string, sharingCount?: number) {
  return JSON.stringify({
    state: {
      subscriptions: [
        {
          id: "gone",
          name: "구글 원",
          amount: 29000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "cloud",
          status: "active",
          cancelUrl: "https://one.google.com/about/plans",
          planId,
          ...(sharingCount ? { sharingCount } : {}),
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      usageLogs: [],
      accounts: [],
    },
    version: 1,
  });
}

/**
 * 가짜 웹 앱: 진짜 웹 앱처럼 받은 origin·state로 SubSlash 끝 화면(#)에 한도·사용량을 싣고 돌려보낸다.
 * 진짜 웹 앱의 코드는 단위 테스트(storage-quota.test.ts)가 돌린다.
 */
async function fakeWebApp(context: BrowserContext, usage: number, limit: number) {
  await context.route("https://script.google.com/**", async (route) => {
    const url = new URL(route.request().url());
    const origin = url.searchParams.get("origin");
    const state = url.searchParams.get("state");
    const back = `${origin}/storage-quota/done#flow=storage&state=${state}&usage=${usage}&limit=${limit}`;
    await route.fulfill({
      contentType: "text/html",
      body: `<script>location.href = ${JSON.stringify(back)};</script>`,
    });
  });
}

async function openCheckIn(page: import("@playwright/test").Page, state: string) {
  await page.addInitScript((value) => localStorage.setItem("subslash-storage", value), state);
  await page.goto("/subs/detail?id=gone");
  await page.getByRole("button", { name: "사용량 체크인" }).first().click({ timeout: 30_000 });
  return page.getByRole("dialog");
}

test.describe("구글 원 체크인의 사용량 측정 (E2E)", () => {
  test("측정하면 새 탭에서 받은 용량으로 비율을 채운다 — 1% 미만은 1%", async ({
    page,
    context,
  }) => {
    await fakeWebApp(context, Math.round(0.5 * GIB), 100 * GIB);
    const dialog = await openCheckIn(page, seed("basic"));
    const input = dialog.getByRole("spinbutton");

    const popup = context.waitForEvent("page");
    await dialog.getByRole("button", { name: "Google 계정에서 사용량 측정" }).click();
    const done = await popup;
    await done.waitForURL(/\/storage-quota\/done/);
    // 값은 '#' 뒤로만 받고, 받은 뒤 주소에서 지운다.
    await expect.poll(() => new URL(done.url()).hash).toBe("");

    await expect(input).toHaveValue("1");
    await expect(dialog.getByText(/1%로 채웠어요/)).toBeVisible();
  });

  // AI 요금제는 Gemini 쓴 날과 용량 비율 칸이 따로 있고, 용량은 반올림하지 않은 소수로 채운다.
  test("AI 요금제는 용량 칸에 소수 비율을 그대로 채운다", async ({ page, context }) => {
    await fakeWebApp(context, Math.round(3.42 * GIB), 5120 * GIB);
    const dialog = await openCheckIn(page, seed("ai-pro"));
    const input = dialog.getByRole("spinbutton", { name: "요금제 용량 중 얼마나 쓰고 있어요?" });

    const popup = context.waitForEvent("page");
    await dialog.getByRole("button", { name: "Google 계정에서 사용량 측정" }).click();
    await (await popup).waitForURL(/\/storage-quota\/done/);

    // 3.42GB / 5TB(5,120GB) = 0.0668% — 칸에는 소수 넷째 자리까지 보인다. 아래 줄도 측정 문장과 같은 GB다.
    await expect(input).toHaveValue("0.0668");
    await expect(dialog.getByText("Google AI Pro 5TB 중 3.42GB")).toBeVisible();
    await expect(dialog.getByText(/한도 5TB 중 3.42GB/)).toBeVisible();
    await expect(dialog.getByText(/1%로 채웠어요/)).toHaveCount(0);
  });

  test("한도가 등록한 요금제와 다르면 채우지 않고 이유를 말한다", async ({ page, context }) => {
    await fakeWebApp(context, 3 * GIB, 5120 * GIB);
    const dialog = await openCheckIn(page, seed("basic"));
    const input = dialog.getByRole("spinbutton");
    const before = await input.inputValue();

    const popup = context.waitForEvent("page");
    await dialog.getByRole("button", { name: "Google 계정에서 사용량 측정" }).click();
    await (await popup).waitForURL(/\/storage-quota\/done/);

    await expect(dialog.getByText(/한도가 달라 채우지 않았어요/)).toBeVisible();
    await expect(input).toHaveValue(before);
  });
});
