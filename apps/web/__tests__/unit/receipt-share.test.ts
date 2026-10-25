import { describe, expect, it } from "vitest";
import type { Receipt, ReceiptLine } from "@subslash/shared";
import { decodeReceiptShare, encodeReceiptShare } from "@lib/receipt-share";

const line = (over: Partial<ReceiptLine> = {}): ReceiptLine => ({
  subscriptionId: "sub-netflix",
  name: "넷플릭스",
  iconUrl: "https://tracker.example/pixel.png",
  chargeDates: ["2026-09-03"],
  upcomingDates: [],
  evidencedDates: [],
  amountKRW: 17000,
  billedKRW: 17000,
  shared: false,
  billingCycle: "monthly",
  killedOn: null,
  usage: { count: 4, costPerUseKRW: 4250, checkedAt: "2026-09-28T10:00:00.000Z" },
  ...over,
});

function receipt(): Receipt {
  const lines = [
    line(),
    line({
      subscriptionId: "sub-yt",
      name: "유튜브 프리미엄",
      amountKRW: 3725,
      billedKRW: 14900,
      shared: true,
      usage: null,
    }),
  ];
  return {
    period: { kind: "month", year: 2026, month: 9 },
    isComplete: true,
    lines,
    totalKRW: 20725,
    billedTotalKRW: 31900,
    chargeCount: 2,
    upcomingCount: 0,
    evidencedCount: 0,
    priciestPerUse: lines[0],
    defendedKRW: 9900,
    defendedUnknownCount: 1,
    killed: [{ subscriptionId: "sub-tving", name: "티빙", killedOn: "2026-09-10" }],
    fx: { historical: 0, current: 0 },
    excluded: { undated: 0, beforeRegistration: 0, trial: 0 },
  };
}

const issuedAt = new Date("2026-10-01T00:00:00.000Z");

describe("영수증 공유 링크", () => {
  it("영수증을 링크로 옮겼다 그대로 되살린다", async () => {
    const hash = await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "pass" });
    expect(hash).toMatch(/^r=1z?\.[A-Za-z0-9_-]+$/);
    const shared = await decodeReceiptShare(`#${hash}`);
    expect(shared?.theme).toBe("pass");
    expect(shared?.issuedAt.toISOString()).toBe(issuedAt.toISOString());
    const back = shared!.receipt;
    expect(back.lines.map((l) => [l.name, l.amountKRW, l.billedKRW, l.shared])).toEqual([
      ["넷플릭스", 17000, 17000, false],
      ["유튜브 프리미엄", 3725, 14900, true],
    ]);
    expect(back.totalKRW).toBe(20725);
    expect(back.priciestPerUse).toBe(back.lines[0]);
    expect(back.killed.map((k) => [k.name, k.killedOn])).toEqual([["티빙", "2026-09-10"]]);
    expect(back.defendedUnknownCount).toBe(1);
  });

  it("구독 ID와 사용자 아이콘 주소는 링크에 싣지 않는다", async () => {
    const hash = await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" });
    const shared = await decodeReceiptShare(hash);
    for (const l of shared!.receipt.lines) {
      expect(l.iconUrl).toBeUndefined();
      expect(l.subscriptionId).not.toMatch(/^sub-/);
    }
  });

  it("압축하지 않은 링크도 읽는다", async () => {
    const hash = await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" });
    // 압축을 모르는 브라우저가 만든 모양으로 다시 싼다.
    const original = await decodeReceiptShare(hash);
    expect(original).not.toBeNull();
    const plainWire = JSON.stringify({
      v: 1,
      p: { kind: "year", year: 2026 },
      c: 0,
      l: [],
      t: [0, 0],
      n: [0, 0, 0],
      pp: null,
      d: [0, 0],
      k: [],
      fx: [0, 0],
      x: [0, 0, 0],
      i: issuedAt.toISOString(),
      th: "chat",
    });
    const b64 = Buffer.from(plainWire, "utf8").toString("base64url");
    const shared = await decodeReceiptShare(`r=1.${b64}`);
    expect(shared?.receipt.period).toEqual({ kind: "year", year: 2026 });
    expect(shared?.receipt.lines).toEqual([]);
  });

  it("틀리거나 잘린 링크는 그리지 않는다", async () => {
    const hash = await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" });
    expect(await decodeReceiptShare("")).toBeNull();
    expect(await decodeReceiptShare("#r=")).toBeNull();
    expect(await decodeReceiptShare("#r=9.abc")).toBeNull();
    expect(await decodeReceiptShare(hash.slice(0, hash.length - 20))).toBeNull();
    expect(await decodeReceiptShare("#r=1.<script>")).toBeNull();
  });

  it("칸 모양이 틀리면 하나라도 받지 않는다", async () => {
    const wrap = (wire: unknown) =>
      decodeReceiptShare(`r=1.${Buffer.from(JSON.stringify(wire)).toString("base64url")}`);
    const base = {
      v: 1,
      p: { kind: "month", year: 2026, month: 9 },
      c: 1,
      l: [["넷플릭스", ["2026-09-03"], [], [], 17000, 17000, 0, "monthly", null, null]],
      t: [17000, 17000],
      n: [1, 0, 0],
      pp: null,
      d: [0, 0],
      k: [],
      fx: [0, 0],
      x: [0, 0, 0],
      i: issuedAt.toISOString(),
      th: "classic",
    };
    expect(await wrap(base)).not.toBeNull();
    expect(await wrap({ ...base, th: "evil" })).toBeNull();
    expect(await wrap({ ...base, p: { kind: "month", year: 2026, month: 13 } })).toBeNull();
    expect(await wrap({ ...base, pp: 5 })).toBeNull();
    expect(await wrap({ ...base, t: [-1, 0] })).toBeNull();
    expect(
      await wrap({
        ...base,
        l: [["넷플릭스", ["javascript:alert(1)"], [], [], 1, 1, 0, "monthly", null, null]],
      }),
    ).toBeNull();
    expect(
      await wrap({ ...base, l: [["x".repeat(500), [], [], [], 1, 1, 0, "monthly", null, null]] }),
    ).toBeNull();
    expect(await wrap({ ...base, l: Array.from({ length: 101 }, () => base.l[0]) })).toBeNull();
  });
});
