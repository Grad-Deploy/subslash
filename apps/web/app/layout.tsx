import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { BottomNav } from "../components/layout/BottomNav";
import { ThemeProvider } from "../components/layout/ThemeProvider";
import { ServiceWorkerRegistrar } from "../components/layout/ServiceWorkerRegistrar";

const geist = Geist({ subsets: ["latin"] });

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
        className={`${geist.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <Header />
          {/*
            숫자를 보는 화면(대시보드·내 구독·절약 현황)이 넓은 화면에서 칸을 나눌 수 있게
            바깥 폭은 넓게 둔다. 읽거나 입력하는 화면은 각 페이지가 스스로 좁힌다(max-w-md 등).
          */}
          <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
