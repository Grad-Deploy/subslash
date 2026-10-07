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
    // 화면 언어는 기기 언어를 따른다(lib/i18n). 테스트는 한국어 문구로 찾으므로 한국어 기기로 연다 —
    // 영어 화면은 i18n.spec.ts가 locale을 바꿔 본다.
    locale: "ko-KR",
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
    // 구글 원 체크인의 '사용량 측정'은 웹 앱 주소가 있어야 보인다. 테스트는 이 주소를 가로채 가짜 웹 앱을 띄운다.
    env: {
      NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN: "true",
      NEXT_PUBLIC_STORAGE_QUOTA_WEB_APP_URL:
        "https://script.google.com/macros/s/e2e-storage-quota/exec",
    },
    reuseExistingServer: !process.env.CI,
  },
});
