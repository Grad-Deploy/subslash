import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { DemoBanner } from "../components/layout/DemoBanner";
import { GmailDiscoveryInbox } from "../components/gmail/GmailDiscoveryInbox";
import { BottomNav } from "../components/layout/BottomNav";
import { SiteChrome } from "../components/layout/SiteChrome";
import { ThemeProvider } from "../components/layout/ThemeProvider";
import { SiteFooter } from "../components/layout/SiteFooter";
import { LocaleEffects } from "../components/layout/LocaleEffects";
import { localeInitScript } from "@lib/i18n/config";
import { ServiceWorkerRegistrar } from "../components/layout/ServiceWorkerRegistrar";
import { NativeAppEffects } from "../components/layout/NativeAppEffects";
import { AppLaunch } from "../components/launch/AppLaunch";
import {
  SITE_DESCRIPTION,
  SITE_METADATA_BASE,
  SITE_TITLE,
  siteOpenGraph,
} from "@lib/site-metadata";

/**
 * 브랜드 시트의 워드마크는 Helvetica 계열의 굵은 그로테스크다. 화면 글꼴도 같은 계열로 맞춰,
 * 로고 옆의 글자가 다른 집안처럼 보이지 않게 한다. Inter는 그 계열의 자유 글꼴이고 굵기 900까지
 * 있어 워드마크를 글자로 그릴 수 있다.
 */
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: SITE_METADATA_BASE,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    ...siteOpenGraph,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
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
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
      </head>
      <body
        className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <LocaleEffects />
          <NativeAppEffects />
          <AppLaunch />
          {/* 앱이 인앱 브라우저로 여는 화면(/oauth/done)에는 사이트 메뉴를 두지 않는다(SiteChrome). */}
          <SiteChrome>
            <Header />
            <DemoBanner />
            <GmailDiscoveryInbox />
          </SiteChrome>
          {/*
            숫자를 보는 화면(대시보드·내 구독·절약 현황)이 넓은 화면에서 칸을 나눌 수 있게
            바깥 폭은 넓게 둔다. 읽거나 입력하는 화면은 각 페이지가 스스로 좁힌다(max-w-md 등).
          */}
          <main className="flex-1 container max-w-6xl mx-auto px-4 py-6">{children}</main>
          <SiteChrome>
            <SiteFooter />
            <BottomNav />
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
