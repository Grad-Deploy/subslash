/**
 * 웹 응답의 Content-Security-Policy(next.config.ts의 `headers()`). 앱 빌드는 정적 파일이라 붙지 않는다.
 *
 * 페이지를 정적으로 두므로 nonce를 쓰지 않는다 — nonce는 요청마다 달라 모든 페이지를 요청마다 서버가
 * 그리게 만든다. 그래서 `script-src`에 'unsafe-inline'이 남아(Next가 페이지마다 넣는 인라인 스크립트,
 * 첫 화면의 테마·언어 스크립트) 주입된 인라인 스크립트는 이 정책이 막지 못한다. 막는 것은 그 밖의 길이다:
 * 바깥 사이트의 스크립트 불러오기, 바깥으로 기록을 보내기(`connect-src`·`img-src`·`form-action`),
 * `<base>`로 상대 주소 바꿔치기, 플러그인, 틀 넣기.
 *
 * 브라우저가 부르는 것은 모두 이 사이트다. 로고·글꼴(next/font가 함께 담는다)·sql.js wasm
 * (`public/vendor/`, PC 기록 읽기)·서비스 워커, 그리고 API(`apiUrl`)다. 바깥 서비스(AI·환율·Google)는
 * 서버가 부른다. 브라우저에서 바깥 주소를 부르게 바꾸면 여기에 그 출처를 더한다 — 빠뜨리면 그 요청만
 * 조용히 막히고 콘솔에 CSP 위반이 남는다.
 */

export interface CspOptions {
  /** `next dev`. React 개발 빌드는 eval을 쓰고, HMR이 웹소켓으로 붙는다. */
  dev?: boolean;
  /** Vercel 미리보기 배포. 미리보기에만 뜨는 Vercel 도구 막대(댓글)가 vercel.live에서 온다. */
  preview?: boolean;
  /** 그림 출처를 따로 좁히는 화면(영수증 공유)이 쓴다. 없으면 기본값. */
  imgSrc?: readonly string[];
}

/** Vercel 도구 막대가 쓰는 출처(https://vercel.com/docs/vercel-toolbar/managing-toolbar). */
const VERCEL_TOOLBAR = {
  script: ["https://vercel.live"],
  connect: ["https://vercel.live", "wss://ws-us3.pusher.com"],
  img: ["https://vercel.live", "https://vercel.com"],
  frame: ["https://vercel.live"],
  style: ["https://vercel.live"],
  font: ["https://vercel.live", "https://assets.vercel.com"],
};

const DEFAULT_IMG_SRC = ["'self'", "data:", "blob:"] as const;

export function contentSecurityPolicy(options: CspOptions = {}): string {
  const { dev = false, preview = false } = options;
  const toolbar = (key: keyof typeof VERCEL_TOOLBAR) => (preview ? VERCEL_TOOLBAR[key] : []);

  const directives: Record<string, readonly string[]> = {
    "default-src": ["'self'"],
    // 'wasm-unsafe-eval': sql.js(wasm)를 컴파일한다. 일반 eval은 열지 않는다.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      ...(dev ? ["'unsafe-eval'"] : []),
      ...toolbar("script"),
    ],
    // 컴포넌트가 style 속성으로 색·크기를 정한다.
    "style-src": ["'self'", "'unsafe-inline'", ...toolbar("style")],
    "img-src": [...(options.imgSrc ?? DEFAULT_IMG_SRC), ...toolbar("img")],
    "font-src": ["'self'", "data:", ...toolbar("font")],
    "connect-src": ["'self'", ...(dev ? ["ws:"] : []), ...toolbar("connect")],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-src": toolbar("frame").length > 0 ? toolbar("frame") : ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(
    ([name, sources]) => `${name} ${sources.join(" ")}`,
  );
  // 개발 서버는 http://localhost라, 하위 요청을 https로 올리면 화면이 깨진다.
  if (!dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
