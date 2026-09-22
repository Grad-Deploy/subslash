import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { DemoBanner } from "../components/layout/DemoBanner";
import { GmailDiscoveryInbox } from "../components/gmail/GmailDiscoveryInbox";
import { BottomNav } from "../components/layout/BottomNav";
import { ThemeProvider } from "../components/layout/ThemeProvider";
import { BrandWordmark } from "../components/brand/Brand";
import { ServiceWorkerRegistrar } from "../components/layout/ServiceWorkerRegistrar";
import { NativeAppEffects } from "../components/layout/NativeAppEffects";

/**
 * 브랜드 시트의 워드마크는 Helvetica 계열의 굵은 그로테스크다. 화면 글꼴도 같은 계열로 맞춰,
 * 로고 옆의 글자가 다른 집안처럼 보이지 않게 한다. Inter는 그 계열의 자유 글꼴이고 굵기 900까지
 * 있어 워드마크를 글자로 그릴 수 있다.
 */
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SubSlash - 구독, 끊을 용기",
  description: "구독 1회 사용 단가 분석과 해지 도우미",
  manifest: "/manifest.json",
  applicationName: "SubSlash",
  appleWebApp: {
    capable: true,
    title: "SubSlash",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Applies the stored theme before first paint so dark-mode users do not get a
// white flash on every navigation. Kept in sync with ThemeProvider.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("subslash-theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <NativeAppEffects />
          <Header />
          <DemoBanner />
          <GmailDiscoveryInbox />
          {/*
            숫자를 보는 화면(대시보드·내 구독·절약 현황)이 넓은 화면에서 칸을 나눌 수 있게
            바깥 폭은 넓게 둔다. 읽거나 입력하는 화면은 각 페이지가 스스로 좁힌다(max-w-md 등).
          */}
          <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">{children}</main>
          {/*
            모바일 하단 탭에 가려지지 않게, 본문 대신 푸터가 아래 여백을 갖는다. 하단 탭이
            홈 표시줄만큼 높아지므로 그 높이도 더한다.
          */}
          <footer className="container max-w-6xl mx-auto px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4">
              <BrandWordmark className="text-xs" />
              <Link
                href="/privacy"
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                개인정보처리방침
              </Link>
            </div>
          </footer>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
