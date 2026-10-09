/**
 * 소개 페이지·앱 소개에 쓰는 앱 화면 캡처(`public/landing/<lang>/`)를 다시 찍는다.
 *
 * 앱용 정적 화면(`apps/web/out`, `build:app`)을 휴대폰 크기(360×640, 3배 = 1080×1920)로 열고, 아래의 **예시 기록**을
 * 설정 → 복원으로 넣은 뒤 찍는다. 예시 기록의 요금은 서비스 목록의 요금이고 체크인은 앱과 같은 함수로 만든다 —
 * 화면에 '샘플 데이터 캡처'라고 밝히므로 실제 사용자의 기록은 쓰지 않는다. 화면이 크게 바뀌면 다시 찍는다.
 *
 *   NEXT_PUBLIC_WEB_ORIGIN=https://www.subslash.me pnpm --filter @subslash/web build:app
 *   pnpm --filter @subslash/web landing:screens            # 영어
 *   pnpm --filter @subslash/web landing:screens -- --lang ko
 *
 * 앱은 API를 배포된 웹에 부르는데, 이 로컬 주소에서는 막힌다(로그인하지 않은 것으로 보인다). 화면에는 영향이 없다.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import {
  POPULAR_SERVICES,
  planFormData,
  presetFormData,
  type Subscription,
  type SubscriptionFormData,
  type UsageLog,
} from "@subslash/shared";
import { buildCheckInLog, createSubscription } from "../../lib/store/records";
import { createBackup } from "../../lib/backup";
import { messages } from "../../lib/i18n/messages";

const arg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const LANG = arg("lang") === "ko" ? "ko" : "en";
const ROOT = resolve(import.meta.dirname, "../../out");
// 한국어 캡처는 `public/landing/`, 영어는 `public/landing/en/`(components/home/screens의 landingScreen과 같은 자리).
const OUT_DIR = LANG === "en" ? "public/landing/en" : "public/landing";
const OUT = resolve(import.meta.dirname, "../..", OUT_DIR);
const PORT = 4789;

/* ---- 예시 기록 ---- */

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
/** 오늘부터 `days`일 뒤의 날(결제일). */
const dayIn = (days: number) => new Date(now.getTime() + days * DAY).getDate();

function subscription(
  id: string,
  serviceId: string,
  options: { planId?: string; billingInDays: number; killedDaysAgo?: number },
): Subscription {
  const preset = POPULAR_SERVICES.find((service) => service.id === serviceId);
  if (!preset) throw new Error(`서비스 목록에 없음: ${serviceId}`);
  const plan = options.planId ? preset.plans?.find((p) => p.id === options.planId) : undefined;
  if (options.planId && !plan) throw new Error(`요금제 없음: ${serviceId}/${options.planId}`);
  const data = {
    ...presetFormData(preset),
    ...(plan ? planFormData(preset, plan) : {}),
    billingDay: dayIn(options.billingInDays),
  } as SubscriptionFormData;
  const createdAt = new Date(now.getTime() - 120 * DAY).toISOString();
  const sub = createSubscription(data, id, createdAt);
  if (options.killedDaysAgo === undefined) return sub;
  // 해지 뒤 첫 결제일이 지나 '결제가 멈췄다'고 확인한 것으로 둔다 — 그래야 지킨 돈으로 센다.
  return {
    ...sub,
    status: "killed",
    killedAt: new Date(now.getTime() - options.killedDaysAgo * DAY).toISOString(),
    killVerifiedAt: new Date(now.getTime() - (options.killedDaysAgo - 35) * DAY).toISOString(),
  };
}

const subscriptions: Subscription[] = [
  subscription("tving", "tving", { planId: "standard", billingInDays: 3 }),
  subscription("coupang", "coupang-wow", { billingInDays: 4 }),
  subscription("netflix", "netflix", { planId: "ads", billingInDays: 12 }),
  subscription("spotify", "spotify", { planId: "individual", billingInDays: 18 }),
  subscription("youtube", "youtube-premium", { planId: "premium", billingInDays: 22 }),
  subscription("wavve", "wavve", { planId: "basic", billingInDays: -5, killedDaysAgo: 40 }),
  subscription("watcha", "watcha", { planId: "basic", billingInDays: -9, killedDaysAgo: 70 }),
];

const checkIn = (subId: string, count: number, daysAgo: number): UsageLog => {
  const sub = subscriptions.find((s) => s.id === subId)!;
  return buildCheckInLog(
    sub,
    count,
    { exchangeRate: 1400 },
    new Date(now.getTime() - daysAgo * DAY),
    `log-${subId}-${daysAgo}`,
  ).log;
};

const usageLogs: UsageLog[] = [
  checkIn("tving", 0, 2),
  checkIn("netflix", 9, 3),
  checkIn("spotify", 24, 5),
  checkIn("youtube", 14, 6),
];

const backup = createBackup(
  {
    subscriptions,
    usageLogs,
    accounts: [],
    exchangeRate: { rate: 1400, source: "manual", updatedAt: now.toISOString() },
  },
  now,
);

/* ---- 정적 서버 ---- */

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function fileFor(urlPath: string): string | null {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\/$/, "") || "/index";
  for (const candidate of [clean, `${clean}.html`, join(clean, "index.html")]) {
    const path = join(ROOT, candidate);
    if (existsSync(path) && statSync(path).isFile()) return path;
  }
  return null;
}

const server = createServer((req, res) => {
  const path = fileFor(req.url ?? "/");
  if (!path) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream" });
  createReadStream(path).pipe(res);
});

/* ---- 찍기 ---- */

async function main() {
  if (!existsSync(join(ROOT, "dashboard.html"))) {
    throw new Error("apps/web/out이 없습니다. 먼저 build:app을 돌려 주세요.");
  }
  mkdirSync(OUT, { recursive: true });
  await new Promise<void>((done) => server.listen(PORT, done));
  const origin = `http://localhost:${PORT}`;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
    locale: LANG === "en" ? "en-US" : "ko-KR",
  });
  await context.addInitScript((lang) => {
    localStorage.setItem("subslash-locale", lang);
    // 첫 실행 소개·시작하기·알림 묻기를 닫아 둔다(화면을 가린다).
    localStorage.setItem("CapacitorStorage.subslash-onboarding-v2-seen", "1");
    localStorage.setItem("subslash_app_start_dismissed:guest", "true");
    localStorage.setItem("subslash-reminder-prompted:guest", "1");
  }, LANG);
  const page = await context.newPage();

  // 설정 → '백업·계정 저장' → 복원으로 예시 기록을 넣는다.
  const t = messages[LANG];
  await page.goto(`${origin}/settings`);
  await page.getByText(t.settings.list.backupTitle, { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "subslash-sample.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: t.backup.dialog.restore, exact: true }).click();
  await page.waitForTimeout(500);

  const shots: [string, string][] = [
    ["dashboard", "/dashboard"],
    ["cancel-guide", "/subs/detail?id=tving"],
    ["gmail-import", "/import"],
    ["savings", "/savings"],
  ];
  for (const [name, path] of shots) {
    await page.goto(`${origin}${path}`);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    // 페이지를 새로 열 때마다 앱 시작 인트로(AppIntro)가 잠깐 덮는다. 사라진 뒤에 찍는다.
    await page
      .waitForFunction(() => !document.querySelector('[class*="AppIntro"]'), undefined, {
        timeout: 10_000,
      })
      .catch(() => undefined);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.error(`찍음: ${OUT_DIR}/${name}.png`);
  }

  await browser.close();
  server.close();
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
