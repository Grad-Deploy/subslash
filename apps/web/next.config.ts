import type { NextConfig } from "next";

import path from "path";
import { contentSecurityPolicy, type CspOptions } from "./lib/csp";

/**
 * 앱(Capacitor)에 담을 정적 빌드인지(`pnpm build:app`, scripts/build-app.ts). lib/platform과 같은 값이다.
 *
 * 정적 내보내기는 서버가 있어야 하는 기능(Request를 쓰는 API 라우트, proxy, redirects)을 받지 않는다.
 * API는 배포된 웹에 두고 앱은 그 주소를 부르므로(lib/api), 앱 빌드에서는 `.ts` 파일을 경로로 읽지
 * 않게 해 `route.ts`와 `proxy.ts`를 뺀다. 페이지와 레이아웃은 모두 `.tsx`다.
 */
const isAppBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "app";

/** 웹 응답의 CSP(lib/csp). 미리보기 배포에만 Vercel 도구 막대의 출처를 연다. */
const cspOptions: CspOptions = {
  dev: process.env.NODE_ENV === "development",
  preview: process.env.VERCEL_ENV === "preview",
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    ignoreBuildErrors: false,
  },
  // AppLaunch(components/launch)가 앱 첫 실행 인트로·소개 슬라이드를 "virtual:app-launch-flow"로
  // 불러온다. 상대 경로(./AppLaunchFlow)를 바로 썼다면 웹 빌드에서도 그 청크가 만들어져(실행되지
  // 않아도 파일로는 남는다), 화면 문구가 웹 번들(.next/static)에 나타난다. 이 가상 지정자를
  // 빌드 대상에 따라 실제 구현 또는 아무 것도 하지 않는 스텁으로 바꿔 끼워, 웹 빌드에는 그
  // 코드 자체가 없게 한다.
  turbopack: {
    resolveAlias: {
      "virtual:app-launch-flow": isAppBuild
        ? "./components/launch/AppLaunchFlow.tsx"
        : "./components/launch/AppLaunchFlowStub.tsx",
    },
  },
  ...(isAppBuild
    ? {
        output: "export",
        pageExtensions: ["tsx"],
        // 빌드 중간 파일을 웹 빌드의 .next가 아니라 out/에 둔다. 정적 내보내기는 끝나면 이
        // 폴더를 내보낸 파일로만 채운다 — 앱(apps/mobile)이 담는 폴더다.
        distDir: "out",
      }
    : {
        // 구독 상세는 /subs/<id>에서 /subs/detail?id=<id>로 옮겼다(lib/routes). 북마크와 이미 보낸
        // 링크가 깨지지 않게 예전 주소를 새 주소로 보낸다. 앱 빌드는 리다이렉트를 쓸 수 없고,
        // 앱에는 예전 주소로 들어올 링크도 없다.
        // 보안 헤더. 다른 사이트가 SubSlash를 보이지 않는 틀(iframe)에 넣어 버튼을 누르게 하는 것
        // (클릭재킹)을 막고, 브라우저가 파일 형식을 짐작해 스크립트로 실행하지 않게 한다. 주소창의
        // 토큰(비밀번호 재설정 링크 등)이 바깥 사이트로 넘어가지 않도록 리퍼러에는 출처만 싣는다.
        // 앱 빌드는 정적 파일이라 헤더를 붙일 서버가 없고, 앱 안에서는 틀에 넣을 수도 없다.
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Content-Security-Policy", value: contentSecurityPolicy(cspOptions) },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=(), payment=()",
                },
              ],
            },
            {
              // 영수증 공유 화면은 남이 지어 보낸 링크의 값을 그린다(lib/receipt-share). 지금은 모든 칸을 글자로만 그리지만,
              // 어느 칸이 실수로 그림 주소가 되어도 바깥 주소를 부르지 못하게(받는 사람의 접속을 알리는 추적 그림) 막는다.
              // 위 규칙의 같은 헤더를 덮으므로 같은 정책에서 그림 출처만 이 사이트로 묶는다 — 다른 화면을 위해
              // 기본 img-src를 넓혀도(미리보기의 도구 막대 등) 이 화면은 넓어지지 않는다.
              source: "/report/receipt/share",
              headers: [
                {
                  key: "Content-Security-Policy",
                  value: contentSecurityPolicy({
                    ...cspOptions,
                    preview: false,
                    imgSrc: ["'self'", "blob:", "data:"],
                  }),
                },
              ],
            },
          ];
        },
        async redirects() {
          return [
            {
              source: "/subs/:id((?!detail$)[^/]+)",
              destination: "/subs/detail?id=:id",
              permanent: false,
            },
          ];
        },
      }),
};

export default nextConfig;
