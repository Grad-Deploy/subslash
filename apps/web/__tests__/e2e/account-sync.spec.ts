import { test, expect, type Browser, type Page } from "@playwright/test";

/**
 * 로그인한 기기끼리의 자동 동기화(hooks/useAccountSync). 두 기기는 따로 연 브라우저 두 개이고,
 * 계정 기록 API는 이 테스트 안의 가짜 서버가 받는다 — 판(savedAt)과 If-Match/If-None-Match
 * 규칙만 흉내 낸다. 실제 DB에서의 조건부 저장은 통합 테스트(account-snapshot.test.ts)가 확인한다.
 */

const ACCOUNT = {
  id: "a1",
  username: "tester",
  email: "tester@gmail.com",
  age: null,
  gender: null,
  emailVerified: true,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const STORAGE_KEY = "subslash-storage";

function subscription(id: string, name: string) {
  return {
    id,
    name,
    amount: 17000,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

type Backup = { exportedAt: string; data: { subscriptions: { id: string; name: string }[] } };

function fakeAccountServer() {
  let snapshot: Backup | null = null;
  let clock = Date.parse("2026-09-15T00:00:00.000Z");

  const summary = () =>
    snapshot && {
      savedAt: snapshot.exportedAt,
      subscriptionCount: snapshot.data.subscriptions.length,
      killedCount: 0,
      usageLogCount: 0,
      linkedAccountCount: 0,
    };

  async function attach(page: Page) {
    await page.route("**/api/auth/me", (route) => route.fulfill({ json: { account: ACCOUNT } }));
    await page.route("**/api/account/snapshot**", async (route) => {
      const req = route.request();
      if (req.method() === "GET") {
        if (!snapshot) return route.fulfill({ status: 404, json: { status: "none" } });
        const onlySummary = new URL(req.url()).searchParams.get("summary") === "1";
        return route.fulfill({
          json: onlySummary
            ? { status: "saved", summary: summary() }
            : { status: "saved", summary: summary(), backup: snapshot },
        });
      }
      if (req.method() === "PUT") {
        const headers = req.headers();
        const ifMatch = headers["if-match"]?.replace(/"/g, "");
        const ok =
          headers["if-none-match"] === "*"
            ? !snapshot
            : ifMatch
              ? snapshot?.exportedAt === ifMatch
              : true;
        if (!ok) {
          return route.fulfill({
            status: 409,
            json: {
              status: "conflict",
              error: "다른 기기에서 먼저 바꿨습니다.",
              summary: summary(),
            },
          });
        }
        clock += 1000;
        snapshot = { ...(req.postDataJSON() as Backup), exportedAt: new Date(clock).toISOString() };
        return route.fulfill({ json: { status: "saved", summary: summary() } });
      }
      return route.continue();
    });
  }

  return {
    attach,
    names: () => snapshot?.data.subscriptions.map((sub) => sub.name) ?? null,
  };
}

/** 새 기기. 기록이 있으면 처음 열 때만 채운다. */
async function device(
  browser: Browser,
  server: ReturnType<typeof fakeAccountServer>,
  seed?: object[],
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await server.attach(page);
  if (seed) {
    await page.addInitScript(
      ([key, value]) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      },
      [
        STORAGE_KEY,
        JSON.stringify({ state: { subscriptions: seed, usageLogs: [], accounts: [] }, version: 1 }),
      ] as const,
    );
  }
  return page;
}

/** 저장소의 구독 목록을 바꾸고 다시 연다(그사이 앱이 꺼져 있던 것처럼). */
async function editOffline(page: Page, change: (subs: object[]) => object[]) {
  await page.evaluate(
    ([key, fn]) => {
      const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
      stored.state.subscriptions = new Function("subs", `return (${fn})(subs)`)(
        stored.state.subscriptions,
      );
      localStorage.setItem(key, JSON.stringify(stored));
    },
    [STORAGE_KEY, change.toString()] as const,
  );
  await page.reload();
}

const subCard = (page: Page, name: string) => page.getByRole("link", { name: new RegExp(name) });

test.describe("계정 자동 동기화 (E2E)", () => {
  test("로그인한 기기에서 등록한 구독이 다른 기기로 넘어간다", async ({ browser }) => {
    const server = fakeAccountServer();

    const phone = await device(browser, server, [subscription("netflix", "넷플릭스")]);
    await phone.goto("/subs");
    await expect.poll(server.names).toEqual(["넷플릭스"]);

    const laptop = await device(browser, server);
    await laptop.goto("/subs");
    await expect(subCard(laptop, "넷플릭스")).toBeVisible();
  });

  test("양쪽이 따로 바뀌면 묻고, 고른 쪽으로 맞춘다", async ({ browser }) => {
    const server = fakeAccountServer();

    const phone = await device(browser, server, [subscription("netflix", "넷플릭스")]);
    await phone.goto("/subs");
    await expect.poll(server.names).toEqual(["넷플릭스"]);

    const laptop = await device(browser, server);
    await laptop.goto("/subs");
    await expect(subCard(laptop, "넷플릭스")).toBeVisible();

    // 휴대폰에서 티빙을 더하고 올린다.
    await editOffline(phone, (subs) => [
      ...subs,
      {
        id: "tving",
        name: "티빙",
        amount: 13900,
        currency: "KRW",
        billingDay: 3,
        billingCycle: "monthly",
        category: "ott",
        status: "active",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
    ]);
    await expect.poll(server.names).toEqual(["넷플릭스", "티빙"]);

    // 그사이 노트북에서는 따로 웨이브를 더했다.
    await editOffline(laptop, (subs) => [
      ...subs,
      {
        id: "wavve",
        name: "웨이브",
        amount: 7900,
        currency: "KRW",
        billingDay: 9,
        billingCycle: "monthly",
        category: "ott",
        status: "active",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ]);

    // 다이얼로그 부품이 창에 이름을 붙이지 않아, 제목이 든 창으로 찾는다.
    const dialog = laptop.getByRole("dialog").filter({ hasText: "어느 기록을 쓸까요?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("구독 2개");

    await dialog.getByRole("button", { name: /계정 기록 쓰기/ }).click();
    await expect(subCard(laptop, "티빙")).toBeVisible();
    await expect(subCard(laptop, "웨이브")).toHaveCount(0);
    // 계정의 기록은 그대로다.
    expect(server.names()).toEqual(["넷플릭스", "티빙"]);
  });
});
