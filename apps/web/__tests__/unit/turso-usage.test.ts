import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkTursoUsage,
  readUsageAlertConfig,
  sumDatabaseUsage,
  usageAlertEmail,
  usageAlerts,
  type UsageAlertConfig,
} from "@lib/turso-usage";

const BASE = {
  TURSO_PLATFORM_API_TOKEN: "token",
  TURSO_ORG_SLUG: "subslash",
  OPS_ALERT_EMAIL: "ops@example.com",
  TURSO_ROWS_WRITTEN_LIMIT: "1000",
};

const db = (rows_written: number, rows_read = 0, storage_bytes = 0) => ({
  total: { rows_written, rows_read, storage_bytes, bytes_synced: 0 },
});

describe("Turso 사용량 알림", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("토큰·조직·받는 주소·한도가 모두 있어야 켜진다", () => {
    expect(readUsageAlertConfig(BASE)).toMatchObject({
      limits: { rows_written: 1000 },
      threshold: 0.8,
    });
    for (const key of Object.keys(BASE)) {
      expect(readUsageAlertConfig({ ...BASE, [key]: undefined }), key).toBeNull();
    }
    // 숫자가 아닌 한도는 적지 않은 것으로 본다
    expect(readUsageAlertConfig({ ...BASE, TURSO_ROWS_WRITTEN_LIMIT: "많이" })).toBeNull();
    expect(readUsageAlertConfig({ ...BASE, TURSO_USAGE_ALERT_PERCENT: "90" })?.threshold).toBe(0.9);
  });

  it("데이터베이스마다의 합계를 더하고, 모양이 다르면 0이 아니라 모른다", () => {
    expect(sumDatabaseUsage({ databases: [db(300, 5, 10), db(400, 1, 2)] })).toEqual({
      rows_written: 700,
      rows_read: 6,
      storage_bytes: 12,
    });
    expect(sumDatabaseUsage({ organization: {} })).toBeNull();
    expect(sumDatabaseUsage({ databases: [{ total: { rows_written: "1" } }] })).toBeNull();
  });

  it("적은 한도의 기준 비율 이상인 지표만 알린다", () => {
    const config = readUsageAlertConfig({
      ...BASE,
      TURSO_ROWS_READ_LIMIT: "100",
    }) as UsageAlertConfig;
    const alerts = usageAlerts({ rows_written: 800, rows_read: 79, storage_bytes: 1e12 }, config);
    // 저장 용량은 한도를 적지 않았으므로 보지 않는다
    expect(alerts.map((a) => a.metric)).toEqual(["rows_written"]);
    const mail = usageAlertEmail(alerts, config);
    expect(mail.subject).toContain("80%");
    expect(mail.text).toContain("행 쓰기: 800 / 1,000 (80%)");
  });

  it("설정이 없으면 Turso를 부르지 않고, 응답이 실패하면 오류로 돌려준다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await checkTursoUsage(null)).toEqual({ status: "off" });
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(new Response("no", { status: 401 }));
    const config = readUsageAlertConfig(BASE);
    expect(await checkTursoUsage(config)).toEqual({ status: "error", reason: "turso_401" });

    fetchMock.mockResolvedValueOnce(Response.json({ databases: [db(10)] }));
    expect(await checkTursoUsage(config)).toEqual({ status: "ok", alerts: 0 });
  });
});
