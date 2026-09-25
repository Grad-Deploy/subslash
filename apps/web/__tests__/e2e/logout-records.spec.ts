import { test, expect, type Page } from "@playwright/test";

/**
 * 로그아웃하면 로그인한 동안의 기록이 화면에 남지 않고 로그인 전 기록으로 돌아온다(lib/records-owner).
 * 계정 기록 API는 이 테스트 안의 가짜 서버가 받는다. 판을 겨루는 규칙은 account-sync.spec.ts가 본다.
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

type Backup = { exportedAt: string; data: { subscriptions: { name: string }[] } };

const subCard = (page: Page, name: string) => page.getByRole("link", { name: new RegExp(name) });

test("로그아웃하면 계정의 기록을 치우고 로그인 전 기록을 보여주며, 다시 로그인하면 돌아온다", async ({
  page,
}) => {
  let loggedIn = false;
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
  const serverNames = () => snapshot?.data.subscriptions.map((sub) => sub.name) ?? null;

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: { account: loggedIn ? ACCOUNT : null } }),
  );
  await page.route("**/api/auth/logout", (route) => {
    loggedIn = false;
    return route.fulfill({ json: { status: "ok" } });
  });
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
      clock += 1000;
      snapshot = { ...(req.postDataJSON() as Backup), exportedAt: new Date(clock).toISOString() };
      return route.fulfill({ json: { status: "saved", summary: summary() } });
    }
    return route.continue();
  });
  await page.addInitScript(
    (value) => {
      if (!localStorage.getItem("subslash-storage"))
        localStorage.setItem("subslash-storage", value);
    },
    JSON.stringify({
      state: { subscriptions: [subscription("n", "넷플릭스")], usageLogs: [], accounts: [] },
      version: 1,
    }),
  );

  // 비로그인으로 쓰던 기록을 가지고 처음 로그인하면 계정에 올라간다.
  loggedIn = true;
  await page.goto("/subs");
  await expect(subCard(page, "넷플릭스")).toBeVisible();
  await expect.poll(serverNames).toEqual(["넷플릭스"]);

  // 로그인한 동안 더한 구독.
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("subslash-storage") ?? "{}");
    stored.state.subscriptions.push({
      id: "y",
      name: "유튜브 프리미엄",
      amount: 14900,
      currency: "KRW",
      billingDay: 3,
      billingCycle: "monthly",
      category: "ott",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    localStorage.setItem("subslash-storage", JSON.stringify(stored));
  });
  await page.reload();
  await expect(subCard(page, "유튜브 프리미엄")).toBeVisible();
  await expect.poll(serverNames).toEqual(["넷플릭스", "유튜브 프리미엄"]);

  await expect(page.getByText("계정과 자동으로 맞추는 중")).toBeVisible();

  await page.getByRole("button", { name: "계정 메뉴 (tester)" }).click();
  await page.getByRole("menuitem", { name: "로그아웃" }).click();

  await expect(subCard(page, "유튜브 프리미엄")).toBeHidden();
  await expect(subCard(page, "넷플릭스")).toBeVisible();
  // 로그인하지 않은 기기에 '계정과 맞추는 중'이라고 쓰지 않는다.
  await expect(page.getByText("파일로 저장하거나 로그인해 두기")).toBeVisible();
  await page.reload();
  await expect(subCard(page, "넷플릭스")).toBeVisible();
  await expect(subCard(page, "유튜브 프리미엄")).toBeHidden();
  // 계정에 이미 올라간 기록은 이 기기에 사본을 남기지 않는다.
  expect(
    await page.evaluate(() => localStorage.getItem("subslash-records:account:a1")),
  ).not.toContain("유튜브");

  loggedIn = true;
  await page.reload();
  await expect(subCard(page, "유튜브 프리미엄")).toBeVisible();
  await expect(subCard(page, "넷플릭스")).toBeVisible();
});
