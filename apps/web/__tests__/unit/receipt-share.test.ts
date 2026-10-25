import { describe, expect, it } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { POPULAR_SERVICES, type Receipt, type ReceiptLine } from "@subslash/shared";
import {
  MAX_SHARE_LINES,
  decodeReceiptShare,
  encodeReceiptShare,
  looksLikeContact,
  shareableReceipt,
} from "@lib/receipt-share";
import { receiptFootnotes } from "@lib/receipt-view";
import { messages } from "@lib/i18n/messages";

const labels = { masked: (n: number) => `구독 ${n}`, maskedKilled: (n: number) => `해지 ${n}` };

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

function receipt(lines: ReceiptLine[] = defaultLines()): Receipt {
  return {
    period: { kind: "month", year: 2026, month: 9 },
    isComplete: true,
    lines,
    totalKRW: 20725,
    billedTotalKRW: 31900,
    chargeCount: 2,
    upcomingCount: 0,
    evidencedCount: 0,
    priciestPerUse: lines[0] ?? null,
    defendedKRW: 9900,
    defendedUnknownCount: 1,
    killed: [{ subscriptionId: "sub-tving", name: "티빙", killedOn: "2026-09-10" }],
    fx: { historical: 0, current: 0 },
    excluded: { undated: 0, beforeRegistration: 0, trial: 0 },
  };
}

function defaultLines(): ReceiptLine[] {
  return [
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
}

const issuedAt = new Date("2026-10-01T00:00:00.000Z");

/** 링크 안의 날 값(JSON)을 꺼낸다 — 링크에 무엇이 실렸는지 보려고. */
function rawWire(hash: string): unknown {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("r")!;
  const [prefix, data] = [
    value.slice(0, value.indexOf(".") + 1),
    value.slice(value.indexOf(".") + 1),
  ];
  const bytes = Buffer.from(data, "base64url");
  return JSON.parse((prefix.endsWith("z.") ? inflateRawSync(bytes) : bytes).toString("utf8"));
}

const plainLink = (wire: unknown) =>
  `r=2.${Buffer.from(JSON.stringify(wire)).toString("base64url")}`;

const baseWire = () => ({
  v: 2,
  p: { kind: "month", year: 2026, month: 9 },
  c: 1,
  l: [["넷플릭스", ["2026-09-03"], [], [], 17000, "monthly", null]],
  t: 17000,
  n: [1, 0, 0],
  d: [0, 0],
  k: [],
  fx: [0, 0],
  x: [0, 0, 0],
  i: issuedAt.toISOString(),
  th: "classic",
});

describe("영수증 공유 링크", () => {
  it("영수증을 링크로 옮겼다 그대로 되살린다", async () => {
    const hash = await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "pass" });
    expect(hash).toMatch(/^r=2z?\.[A-Za-z0-9_-]+$/);
    const shared = await decodeReceiptShare(`#${hash}`, labels);
    expect(shared?.theme).toBe("pass");
    expect(shared?.issuedAt.toISOString()).toBe(issuedAt.toISOString());
    const back = shared!.receipt;
    expect(back.lines.map((l) => [l.name, l.amountKRW])).toEqual([
      ["넷플릭스", 17000],
      ["유튜브 프리미엄", 3725],
    ]);
    expect(back.totalKRW).toBe(20725);
    expect(back.killed.map((k) => [k.name, k.killedOn])).toEqual([["티빙", "2026-09-10"]]);
    expect(back.defendedUnknownCount).toBe(1);
  });

  it("사용 횟수·1회 단가·나눠 내는 금액·구독 ID·아이콘 주소는 링크에 싣지 않는다", async () => {
    const hash = (await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" }))!;
    const raw = JSON.stringify(rawWire(hash));
    for (const secret of ["4250", "14900", "31900", "sub-", "tracker.example", "checkedAt"]) {
      expect(raw).not.toContain(secret);
    }
    const back = (await decodeReceiptShare(hash, labels))!.receipt;
    expect(back.priciestPerUse).toBeNull();
    expect(back.billedTotalKRW).toBe(back.totalKRW);
    for (const l of back.lines) {
      expect(l).toMatchObject({ usage: null, shared: false, billedKRW: l.amountKRW });
      expect(l.iconUrl).toBeUndefined();
    }
  });

  it("이름을 가리면 원본을 싣지 않고 받는 쪽 언어로 '구독 1'이라고 그린다", async () => {
    const hash = (await encodeReceiptShare(
      { receipt: receipt(), issuedAt, theme: "classic" },
      { maskNames: true },
    ))!;
    const raw = JSON.stringify(rawWire(hash));
    for (const name of ["넷플릭스", "유튜브", "티빙"]) expect(raw).not.toContain(name);
    const back = (await decodeReceiptShare(hash, labels))!.receipt;
    expect(back.lines.map((l) => l.name)).toEqual(["구독 1", "구독 2"]);
    expect(back.killed.map((k) => k.name)).toEqual(["해지 1"]);
    // 함께 보내는 글도 같은 영수증으로 만든다
    const shown = shareableReceipt(receipt(), { maskNames: true }, labels);
    expect(shown.lines.map((l) => l.name)).toEqual(["구독 1", "구독 2"]);
    expect(shown.lines.every((l) => l.usage === null && !l.shared)).toBe(true);
  });

  it("주소·이메일·전화번호처럼 보이는 이름은 보낼 때 가리고, 받을 때는 그리지 않는다", async () => {
    for (const name of [
      "로그인하려면 evil.com 방문",
      "https://bit.ly/x",
      "www.example",
      "문의 help@evil.kr",
      "010-1234-5678로 연락",
    ]) {
      expect(looksLikeContact(name), name).toBe(true);
      const hash = (await encodeReceiptShare({
        receipt: receipt([line({ name })]),
        issuedAt,
        theme: "classic",
      }))!;
      expect(JSON.stringify(rawWire(hash))).not.toContain(name);
      const back = (await decodeReceiptShare(hash, labels))!.receipt;
      expect(back.lines[0].name).toBe("구독 1");

      const forged = baseWire();
      forged.l[0][0] = name;
      expect(await decodeReceiptShare(plainLink(forged), labels), name).toBeNull();
    }
  });

  it("서비스 목록의 이름은 연락처로 보지 않는다", () => {
    const names = POPULAR_SERVICES.flatMap((s) => [s.name, s.nameKo, s.nameEn ?? s.nameKo]);
    expect(names.filter(looksLikeContact)).toEqual([]);
    expect(Math.max(...names.map((n) => n.length))).toBeLessThanOrEqual(60);
  });

  it("받는 쪽 상한을 넘는 영수증은 링크를 만들지 않는다", async () => {
    const many = Array.from({ length: MAX_SHARE_LINES + 1 }, (_, i) =>
      line({ subscriptionId: `s${i}`, name: `구독${i}` }),
    );
    expect(
      await encodeReceiptShare({ receipt: receipt(many), issuedAt, theme: "classic" }),
    ).toBeNull();
    const forged = baseWire();
    forged.l = Array.from({ length: MAX_SHARE_LINES + 1 }, () => forged.l[0]);
    expect(await decodeReceiptShare(plainLink(forged), labels)).toBeNull();
  });

  it("작게 압축해 크게 풀리는 링크는 상한에서 멈춘다", async () => {
    const bomb = deflateRawSync(Buffer.alloc(5 * 1024 * 1024, 0x20)).toString("base64url");
    expect(bomb.length).toBeLessThan(10_000);
    expect(await decodeReceiptShare(`r=2z.${bomb}`, labels)).toBeNull();
  });

  it("틀리거나 잘린 링크는 그리지 않는다", async () => {
    const hash = (await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" }))!;
    expect(await decodeReceiptShare("", labels)).toBeNull();
    expect(await decodeReceiptShare("#r=", labels)).toBeNull();
    expect(await decodeReceiptShare("#r=9.abc", labels)).toBeNull();
    expect(await decodeReceiptShare(hash.slice(0, hash.length - 20), labels)).toBeNull();
    expect(await decodeReceiptShare("#r=2.<script>", labels)).toBeNull();
    // 예전 형식(1판)은 배포된 적이 없어 받지 않는다
    expect(await decodeReceiptShare(hash.replace("r=2", "r=1"), labels)).toBeNull();
  });

  it("칸 모양이 틀리면 하나라도 받지 않는다", async () => {
    const wrap = (wire: unknown) => decodeReceiptShare(plainLink(wire), labels);
    const base = baseWire();
    expect(await wrap(base)).not.toBeNull();
    expect(await wrap({ ...base, th: "evil" })).toBeNull();
    expect(await wrap({ ...base, v: 1 })).toBeNull();
    expect(await wrap({ ...base, p: { kind: "month", year: 2026, month: 13 } })).toBeNull();
    expect(await wrap({ ...base, t: -1 })).toBeNull();
    expect(
      await wrap({
        ...base,
        l: [["넷플릭스", ["javascript:alert(1)"], [], [], 1, "monthly", null]],
      }),
    ).toBeNull();
    expect(
      await wrap({ ...base, l: [["x".repeat(61), [], [], [], 1, "monthly", null]] }),
    ).toBeNull();
    expect(
      await wrap({
        ...base,
        l: [["넷플릭스", Array(41).fill("2026-09-03"), [], [], 1, "monthly", null]],
      }),
    ).toBeNull();
    expect(await wrap([base])).toBeNull();
  });

  it("아무렇게나 바꾼 링크에도 예외를 던지지 않는다", async () => {
    let seed = 7;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    const junk = [null, -1, 1e20, NaN, "", "<img src=x onerror=alert(1)>", [], {}, [[]], true];
    const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
    for (let round = 0; round < 300; round++) {
      const wire = JSON.parse(JSON.stringify(baseWire())) as Record<string, unknown>;
      const key = pick(Object.keys(wire));
      wire[key] = pick(junk);
      // 바꾼 값이 우연히 맞는 모양일 수도 있다(해지 목록을 빈 배열로). 그럴 때는 온전한 영수증이어야 한다.
      const shared = await decodeReceiptShare(plainLink(wire), labels);
      if (shared) {
        expect(Array.isArray(shared.receipt.lines)).toBe(true);
        expect(Number.isFinite(shared.receipt.totalKRW)).toBe(true);
        expect(Number.isNaN(shared.issuedAt.getTime())).toBe(false);
      }
      const bytes = Buffer.from(
        Array.from({ length: 1 + Math.floor(rand() * 200) }, () => Math.floor(rand() * 256)),
      );
      await expect(
        decodeReceiptShare(`r=2z.${bytes.toString("base64url")}`, labels),
      ).resolves.toBeNull();
    }
  });

  it("공유받은 영수증은 알림 맨 앞에 '확인되지 않은 내용'을 적는다", () => {
    const t = messages.ko;
    const notes = receiptFootnotes(t, receipt(), { unverified: true });
    expect(notes[0]).toBe(t.receiptView.shared.unverifiedMark);
    expect(receiptFootnotes(t, receipt())).not.toContain(t.receiptView.shared.unverifiedMark);
  });
});
