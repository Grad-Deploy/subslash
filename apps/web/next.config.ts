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
