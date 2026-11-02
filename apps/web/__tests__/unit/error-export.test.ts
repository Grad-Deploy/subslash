import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const open = vi.hoisted(() => ({ value: true }));
vi.mock("../../lib/privacy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/privacy")>()),
  isErrorLogExportOpen: () => open.value,
}));

const { exportErrorLine, redactSecrets, resetErrorExportBudget } =
  await import("../../lib/error-export");

describe("redactSecrets", () => {
  it.each([
    ["/verify-email?token=abc.def&x=1", "abc.def"],
    ["/api/x?code=signed-code", "signed-code"],
    ['{"sessionToken":"tok-1"}', "tok-1"],
    ["Authorization: Bearer tok-2", "tok-2"],
    ["jwt eyJhbGciOiJFZERTQSJ9.eyJhIjoxfQ.sig", "eyJhbGci"],
    ["hash " + "a".repeat(64), "a".repeat(64)],
    ["connect libsql://prod-db.turso.io failed", "prod-db"],
    ["key re_abcdefghijklmn", "re_abcdefghijklmn"],
    ["mail someone@example.com rejected", "someone@example.com"],
    ["Failed query: select 1\nparams: me@example.com,secret-hash", "secret-hash"],
  ])("%s에서 값을 지운다", (input, secret) => {
    expect(redactSecrets(input)).not.toContain(secret);
  });

  it("값이 없는 오류 문장은 그대로 둔다", () => {
    const line = "[api/fx] upstream responded 502";
    expect(redactSecrets(line)).toBe(line);
  });
});

describe("exportErrorLine", () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));

  beforeEach(() => {
    open.value = true;
    resetErrorExportBudget();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("GRAFANA_LOKI_URL", "https://logs.example/loki/api/v1/push");
    vi.stubEnv("GRAFANA_LOKI_USER", "123");
    vi.stubEnv("GRAFANA_LOKI_TOKEN", "glc_secret");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("값을 지운 한 줄만 라벨과 함께 보낸다", async () => {
    exportErrorLine("[api/auth/me] failed token=abc for me@example.com", 1_000);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = String(init.body);
    expect(body).not.toContain("abc");
    expect(body).not.toContain("me@example.com");
    expect(JSON.parse(body).streams[0].stream).toEqual({
      app: "subslash",
      env: "development",
      level: "error",
    });
    expect(JSON.parse(body).streams[0].values[0][0]).toBe("1000000000");
  });

  it("방침을 게시하기 전이나 설정이 없으면 보내지 않는다", () => {
    open.value = false;
    exportErrorLine("[x] y");
    open.value = true;
    vi.stubEnv("GRAFANA_LOKI_TOKEN", "");
    exportErrorLine("[x] y");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("쏟아져도 분당 한도까지만 보낸다", async () => {
    for (let i = 0; i < 40; i += 1) exportErrorLine("[x] y", 5_000_000);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(30));
  });

  it("보내기가 실패해도 던지지 않는다", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("down"));
    expect(() => exportErrorLine("[x] y", 9_000_000)).not.toThrow();
    await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());
  });
});
