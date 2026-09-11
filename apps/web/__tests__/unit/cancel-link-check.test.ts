import { describe, it, expect } from "vitest";
import {
  PROBE_PATH_PREFIX,
  checkLink,
  classifyTrace,
  collectCancelLinks,
  renderReport,
  traceUrl,
  type CancelLink,
  type LinkResult,
} from "../../scripts/cancel-links/check";

type Route = Response | Error | ((init?: RequestInit) => Response);

/**
 * 주소별로 정해 둔 응답을 돌려주는 가짜 fetch. 없는 경로를 떠보는 요청은
 * "probe" 키로 받는다. 정해 두지 않은 주소를 요청하면 연결 실패로 끝난다.
 */
function fakeFetch(routes: Record<string, Route>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const route = routes[url.includes(PROBE_PATH_PREFIX) ? "probe" : url];
    if (!route) throw new Error(`테스트에 없는 요청: ${url}`);
    if (route instanceof Error) throw route;
    return typeof route === "function" ? route(init) : route.clone();
  }) as typeof fetch;
}

const respond = (status: number, headers?: HeadersInit) => new Response(null, { status, headers });
const redirect = (location: string) => respond(302, { location });

const netflix: CancelLink = {
  url: "https://www.netflix.com/cancelplan",
  kind: "direct",
  usedBy: ["넷플릭스"],
};

describe("해지 링크 판정", () => {
  it("해지 경로가 열리고 없는 주소에는 404를 주면 '열림'이다", async () => {
    const result = await checkLink(
      netflix,
      fakeFetch({ [netflix.url]: respond(200), probe: respond(404) }),
    );

    expect(result.verdict).toBe("ok");
  });

  it("없는 주소에도 200을 주는 사이트는 '열림'이라고 하지 않는다", async () => {
    // SPA는 어떤 경로든 같은 첫 화면을 준다. 이때 200은 해지 경로가 있다는
    // 증거가 아니다.
    const result = await checkLink(
      netflix,
      fakeFetch({ [netflix.url]: respond(200), probe: respond(200) }),
    );

    expect(result.verdict).toBe("unverified");
  });

  it("앞에 언어 경로가 붙는 이동은 같은 화면으로 본다", async () => {
    const result = await checkLink(
      netflix,
      fakeFetch({
        [netflix.url]: redirect("/kr/cancelplan"),
        "https://www.netflix.com/kr/cancelplan": respond(200),
        probe: respond(404),
      }),
    );

    expect(result.verdict).toBe("ok");
    expect(result.finalUrl).toBe("https://www.netflix.com/kr/cancelplan");
  });

  it("로그인 화면으로 넘어가면 깨진 링크가 아니라 '로그인'이다", async () => {
    const spotify: CancelLink = {
      url: "https://www.spotify.com/account/plan/manage",
      kind: "direct",
      usedBy: ["스포티파이"],
    };
    const result = await checkLink(
      spotify,
      fakeFetch({
        [spotify.url]: redirect("https://accounts.spotify.com/ko/login?continue=x"),
        "https://accounts.spotify.com/ko/login?continue=x": respond(200),
      }),
    );

    expect(result.verdict).toBe("login");
  });

  it("401은 로그인이 필요하다는 뜻이다", () => {
    const result = classifyTrace(netflix, { hops: [{ url: netflix.url, status: 401 }] });

    expect(result.verdict).toBe("login");
  });

  it("해지 경로가 첫 화면으로 돌아가면 확인이 필요하다", async () => {
    const result = await checkLink(
      netflix,
      fakeFetch({
        [netflix.url]: redirect("https://www.netflix.com/"),
        "https://www.netflix.com/": respond(200),
      }),
    );

    expect(result.verdict).toBe("moved");
    expect(result.reason).toContain("첫 화면");
  });

  it("404는 없는 주소다", async () => {
    const result = await checkLink(netflix, fakeFetch({ [netflix.url]: respond(404) }));

    expect(result.verdict).toBe("broken");
  });

  it("403은 막힌 것이지 없는 것이 아니다", async () => {
    const result = await checkLink(netflix, fakeFetch({ [netflix.url]: respond(403) }));

    expect(result.verdict).toBe("unreachable");
  });

  it("도메인이 사라지면 없는 주소, 응답이 없으면 자동 확인 불가다", async () => {
    const dnsError = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ENOTFOUND" },
    });
    const timeout = new DOMException("timed out", "TimeoutError");

    expect((await checkLink(netflix, fakeFetch({ [netflix.url]: dnsError }))).verdict).toBe(
      "broken",
    );
    expect((await checkLink(netflix, fakeFetch({ [netflix.url]: timeout }))).verdict).toBe(
      "unreachable",
    );
  });

  it("한 번 연결에 실패해도 다시 해 보고 판정한다", async () => {
    let attempts = 0;
    const result = await checkLink(
      netflix,
      fakeFetch({
        [netflix.url]: () => {
          attempts += 1;
          if (attempts === 1) {
            throw Object.assign(new TypeError("fetch failed"), { cause: { code: "EAI_AGAIN" } });
          }
          return respond(200);
        },
        probe: respond(404),
      }),
    );

    expect(attempts).toBe(2);
    expect(result.verdict).toBe("ok");
  });

  it("끝나지 않는 리다이렉트는 자동 확인 불가다", async () => {
    const result = await checkLink(netflix, fakeFetch({ [netflix.url]: redirect(netflix.url) }));

    expect(result.verdict).toBe("unreachable");
    expect(result.reason).toContain("리다이렉트");
  });

  it("entry 링크는 www·m 차이로 옮겨가도 '열림'이고, 없는 경로를 떠보지 않는다", async () => {
    // probe 경로를 정해 두지 않았으므로, 떠보는 요청을 보냈다면 결과가 달라진다.
    const coupang: CancelLink = { url: "https://m.coupang.com/", kind: "entry", usedBy: ["쿠팡"] };
    const result = await checkLink(
      coupang,
      fakeFetch({
        [coupang.url]: redirect("https://www.coupang.com/"),
        "https://www.coupang.com/": respond(200),
      }),
    );

    expect(result.verdict).toBe("ok");
  });

  it("entry 링크라도 다른 사이트로 옮겨가면 확인이 필요하다", async () => {
    const chatgpt: CancelLink = {
      url: "https://chat.openai.com/",
      kind: "entry",
      usedBy: ["챗GPT 플러스"],
    };
    const result = await checkLink(
      chatgpt,
      fakeFetch({
        [chatgpt.url]: redirect("https://chatgpt.com/"),
        "https://chatgpt.com/": respond(200),
      }),
    );

    expect(result.verdict).toBe("moved");
    expect(result.finalUrl).toBe("https://chatgpt.com/");
  });
});

describe("리다이렉트 추적", () => {
  it("받은 쿠키를 다음 요청에 다시 보내고, 상관없는 도메인의 쿠키는 받지 않는다", async () => {
    const seen: (string | null)[] = [];
    const trace = await traceUrl(
      "https://example.com/start",
      fakeFetch({
        "https://example.com/start": respond(302, [
          ["location", "https://www.example.com/next"],
          ["set-cookie", "session=abc; Path=/; Domain=.example.com"],
          ["set-cookie", "evil=1; Domain=other.com"],
        ]),
        "https://www.example.com/next": (init) => {
          seen.push(new Headers(init?.headers).get("cookie"));
          return respond(200);
        },
      }),
    );

    expect(trace.hops.map((hop) => hop.status)).toEqual([302, 200]);
    expect(seen).toEqual(["session=abc"]);
  });
});

describe("점검 대상 수집", () => {
  const links = collectCancelLinks();

  it("같은 주소는 한 번만 확인하고, 쓰는 곳을 모두 적는다", () => {
    const apple = links.filter(
      (link) => link.url === "https://apps.apple.com/account/subscriptions",
    );

    expect(apple).toHaveLength(1);
    expect(apple[0].kind).toBe("direct");
    expect(apple[0].usedBy).toEqual(
      expect.arrayContaining(["아이클라우드", "애플 앱스토어 구독", "Apple App Store 인앱결제"]),
    );
  });

  it("결제 수단 링크도 확인하고, 첫 화면 주소는 entry로 본다", () => {
    const kakaopay = links.find((link) => link.url === "https://pay.kakao.com");

    expect(kakaopay?.kind).toBe("entry");
  });
});

describe("점검 보고서", () => {
  const result = (url: string, verdict: LinkResult["verdict"], finalUrl?: string): LinkResult => ({
    link: { url, kind: "direct", usedBy: [url] },
    verdict,
    reason: "사유",
    finalUrl,
  });

  it("확인 필요를 먼저 보이고, 문제 없어 보이는 것은 접어 둔다", () => {
    const report = renderReport(
      [
        result("https://ok.example/a", "ok"),
        result("https://blocked.example/a", "unreachable"),
        result("https://moved.example/a", "moved", "https://moved.example/"),
      ],
      new Date("2026-09-01T00:00:00Z"),
    );

    expect(report).toContain("## 해지 링크 점검 (2026-09-01)");
    expect(report).toContain("확인 필요 (1)");
    expect(report).toContain("도착: https://moved.example/");
    expect(report.indexOf("moved.example")).toBeLessThan(report.indexOf("blocked.example"));
    expect(report.indexOf("<details>")).toBeLessThan(report.indexOf("ok.example"));
  });

  it("확인할 것이 없으면 '없음'이라고 적는다", () => {
    const report = renderReport(
      [result("https://ok.example/a", "ok")],
      new Date("2026-09-01T00:00:00Z"),
    );

    expect(report).toContain("### 확인 필요 (0)\n\n없음");
  });
});
