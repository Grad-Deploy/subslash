import type { NextConfig } from "next";

import path from "path";

/**
 * 앱(Capacitor)에 담을 정적 빌드인지(`pnpm build:app`, scripts/build-app.ts). lib/platform과 같은 값이다.
 *
 * 정적 내보내기는 서버가 있어야 하는 기능(Request를 쓰는 API 라우트, proxy, redirects)을 받지 않는다.
 * API는 배포된 웹에 두고 앱은 그 주소를 부르므로(lib/api), 앱 빌드에서는 `.ts` 파일을 경로로 읽지
 * 않게 해 `route.ts`와 `proxy.ts`를 뺀다. 페이지와 레이아웃은 모두 `.tsx`다.
 */
const isAppBuild = process.env.NEXT_PUBLIC_BUILD_TARGET === "app";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    ignoreBuildErrors: false,
  },
  // AppLaunch(components/launch)가 앱 첫 실행 인트로·환영 화면을 "virtual:app-launch-flow"로
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
                { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=(), payment=()",
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
