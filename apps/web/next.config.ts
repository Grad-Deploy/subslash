import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../../"),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // 구독 상세는 /subs/<id>에서 /subs/detail?id=<id>로 옮겼다(lib/routes). 북마크와 이미 보낸
  // 링크가 깨지지 않게 예전 주소를 새 주소로 보낸다. 앱(정적 내보내기) 빌드는 리다이렉트를
  // 쓸 수 없으므로 그 빌드에서는 이 설정을 뺀다.
  async redirects() {
    return [
      {
        source: "/subs/:id((?!detail$)[^/]+)",
        destination: "/subs/detail?id=:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
