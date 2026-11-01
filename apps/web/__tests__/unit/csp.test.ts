import { describe, it, expect } from "vitest";
import { contentSecurityPolicy } from "../../lib/csp";

/** "a b; c d" → { a: ["b"], c: ["d"] } */
function parse(policy: string): Record<string, string[]> {
  return Object.fromEntries(
    policy.split("; ").map((part) => {
      const [name, ...sources] = part.split(" ");
      return [name, sources];
    }),
  );
}

describe("웹 응답의 CSP", () => {
  const prod = parse(contentSecurityPolicy());

  it("바깥 사이트의 스크립트·연결·폼·틀을 막는다", () => {
    expect(prod["default-src"]).toEqual(["'self'"]);
    expect(prod["script-src"]).not.toContain("https:");
    expect(prod["script-src"]).not.toContain("*");
    expect(prod["connect-src"]).toEqual(["'self'"]);
    expect(prod["form-action"]).toEqual(["'self'"]);
    expect(prod["object-src"]).toEqual(["'none'"]);
    expect(prod["base-uri"]).toEqual(["'none'"]);
    expect(prod["frame-src"]).toEqual(["'none'"]);
    expect(prod["frame-ancestors"]).toEqual(["'none'"]);
    expect(prod).toHaveProperty("upgrade-insecure-requests");
  });

  it("운영에서는 eval을 열지 않고, sql.js wasm만 연다", () => {
    expect(prod["script-src"]).not.toContain("'unsafe-eval'");
    expect(prod["script-src"]).toContain("'wasm-unsafe-eval'");
  });

  it("개발 서버는 React의 eval과 HMR 웹소켓을 열고, https로 올리지 않는다", () => {
    const dev = parse(contentSecurityPolicy({ dev: true }));
    expect(dev["script-src"]).toContain("'unsafe-eval'");
    expect(dev["connect-src"]).toContain("ws:");
    expect(dev).not.toHaveProperty("upgrade-insecure-requests");
  });

  it("미리보기 배포에만 Vercel 도구 막대의 출처를 연다", () => {
    expect(contentSecurityPolicy()).not.toContain("vercel.live");
    const preview = parse(contentSecurityPolicy({ preview: true }));
    expect(preview["script-src"]).toContain("https://vercel.live");
    expect(preview["frame-src"]).toEqual(["https://vercel.live"]);
  });

  it("그림 출처를 좁힌 화면은 그 값만 쓴다", () => {
    const share = parse(contentSecurityPolicy({ imgSrc: ["'self'"] }));
    expect(share["img-src"]).toEqual(["'self'"]);
    expect(share["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("브라우저가 부르는 것은 이 사이트뿐이다 — 정적 파일에 바깥 출처가 없다", () => {
    // 로고·글꼴·wasm이 바깥 주소로 바뀌면 이 정책이 조용히 막는다.
    for (const name of ["img-src", "font-src", "worker-src", "manifest-src"]) {
      expect(prod[name].every((source) => !source.startsWith("http"))).toBe(true);
    }
  });
});
