import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkTursoUsage,
  readOrganizationUsage,
  readPlanQuotas,
  readUsageAlertConfig,
  usageAlertEmail,
  usageAlerts,
} from "@lib/turso-usage";

const BASE = {
  TURSO_PLATFORM_API_TOKEN: "token",
  TURSO_ORG_SLUG: "subslash",
  OPS_ALERT_EMAIL: "ops@example.com",
};

// 2026년 10월 실제 응답에서 값만 줄인 모양
const usageBody = (rows_written: number) => ({
  organization: {
    uuid: "org",
    usage: { rows_read: 100, rows_written, storage_bytes: 10, bytes_synced: 0, databases: 2 },
  },
  databases: { "db-1": { total: { rows_read: 100, rows_written, storage_bytes: 10 } } },
});
const plansBody = {
  plans: [
    { name: "starter", quotas: { rowsRead: 500_000_000, rowsWritten: 1000, storage: 5e9 } },
    { name: "developer", quotas: { rowsRead: 1, rowsWritten: 1, storage: 1 } },
  ],
};
const subscriptionBody = { subscription: { plan: "starter", overages: false } };
const organizationsBody = (blocked = false) => [
  { slug: "subslash", blocked_reads: false, blocked_writes: blocked },
];

function stubTurso(responses: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = url.replace("https://api.turso.tech/v1", "");
    return path in responses
      ? Response.json(responses[path])
      : new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const turso = (rows_written: number, blocked = false) => ({
  "/organizations/subslash/usage": usageBody(rows_written),
  "/organizations/subslash/subscription": subscriptionBody,
  "/organizations/subslash/plans": plansBody,
  "/organizations": organizationsBody(blocked),
});

describe("Turso 사용량 알림", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("토큰·조직·받는 주소가 모두 있어야 켜진다", () => {
    expect(readUsageAlertConfig(BASE)).toMatchObject({ limits: {}, threshold: 0.8 });
    for (const key of Object.keys(BASE)) {
      expect(readUsageAlertConfig({ ...BASE, [key]: undefined }), key).toBeNull();
    }
    expect(
      readUsageAlertConfig({
        ...BASE,
        TURSO_ROWS_WRITTEN_LIMIT: "많이",
        TURSO_USAGE_ALERT_PERCENT: "90",
      }),
    ).toMatchObject({ limits: {}, threshold: 0.9 });
  });

  it("조직 사용량과 요금제 한도를 읽고, 모양이 다르면 0이 아니라 모른다", () => {
    expect(readOrganizationUsage(usageBody(700))).toEqual({
      rows_written: 700,
      rows_read: 100,
      storage_bytes: 10,
    });
    expect(readOrganizationUsage({ databases: [] })).toBeNull();
    expect(readOrganizationUsage({ organization: { usage: { rows_written: "1" } } })).toBeNull();
    expect(readPlanQuotas(plansBody, "starter")).toEqual({
      rows_written: 1000,
      rows_read: 500_000_000,
      storage_bytes: 5e9,
    });
    expect(readPlanQuotas(plansBody, "enterprise")).toBeNull();
  });

  it("한도의 기준 비율 이상인 지표만 알린다", () => {
    const alerts = usageAlerts(
      { rows_written: 800, rows_read: 79, storage_bytes: 1e12 },
      { rows_written: 1000, rows_read: 100 },
      0.8,
    );
    // 저장 용량은 한도가 없으므로 보지 않는다
    expect(alerts.map((a) => a.metric)).toEqual(["rows_written"]);
    const mail = usageAlertEmail(alerts, { organization: "subslash" });
    expect(mail.subject).toContain("80%");
    expect(mail.text).toContain("행 쓰기: 800 / 1,000 (80%)");
  });

  it("설정이 없으면 Turso를 부르지 않는다", async () => {
    const fetchMock = stubTurso({});
    expect(await checkTursoUsage(null)).toEqual({ status: "off" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("요금제 한도 아래면 보내지 않고, 넘거나 막혔으면 메일을 보낸다", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const config = readUsageAlertConfig(BASE);

    stubTurso(turso(10));
    expect(await checkTursoUsage(config)).toEqual({ status: "ok", alerts: 0 });

    // 메일 키가 없으면 보낸 것으로 치지 않는다 — 알림이 조용히 사라지지 않게
    stubTurso(turso(900));
    expect(await checkTursoUsage(config)).toEqual({ status: "error", reason: "email_not_sent" });

    stubTurso(turso(10, true));
    expect(await checkTursoUsage(config)).toEqual({ status: "error", reason: "email_not_sent" });

    // 환경 변수 한도가 요금제 한도보다 앞선다
    stubTurso(turso(10));
    expect(
      await checkTursoUsage(readUsageAlertConfig({ ...BASE, TURSO_ROWS_WRITTEN_LIMIT: "10" })),
    ).toEqual({ status: "error", reason: "email_not_sent" });
    vi.unstubAllEnvs();
  });

  it("토큰이 틀렸거나 요금제를 모르면 오류로 돌려준다", async () => {
    const config = readUsageAlertConfig(BASE);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("no", { status: 401 })),
    );
    expect(await checkTursoUsage(config)).toEqual({ status: "error", reason: "turso_401" });

    stubTurso({
      ...turso(10),
      "/organizations/subslash/subscription": { subscription: { plan: "enterprise" } },
    });
    expect(await checkTursoUsage(config)).toEqual({ status: "error", reason: "shape" });
  });
});
