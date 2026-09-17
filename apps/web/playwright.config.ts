import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
    },
    // iOS의 Safari와 앱(Capacitor iOS)은 WebKit으로 그린다. Mac 없이도 같은 엔진으로 iPhone
    // 화면을 돌려, WebKit에서만 깨지는 레이아웃을 잡는다.
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 15"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    // Gmail 자동 가져오기는 시작일(lib/privacy.ts) 전이라 꺼져 있다. 테스트 서버에서만 연다.
    env: { NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN: "true" },
    reuseExistingServer: !process.env.CI,
  },
});
