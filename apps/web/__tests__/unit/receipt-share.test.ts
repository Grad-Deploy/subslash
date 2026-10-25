import { describe, expect, it } from "vitest";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  POPULAR_SERVICES,
  buildReceipt,
  type Receipt,
  type ReceiptLine,
  type Subscription,
} from "@subslash/shared";
import {
  MAX_SHARE_LINES,
  decodeReceiptShare,
  encodeReceiptShare,
  looksLikeContact,
  shareableReceipt,
} from "@lib/receipt-share";
import { describeReceiptLine, formatReceiptShareText, receiptFootnotes } from "@lib/receipt-view";
import { messages } from "@lib/i18n/messages";
import { receiptArt } from "@lib/receipt-art";

const NOW = new Date("2026-10-25T12:00:00.000Z");
const labels = { masked: (n: number) => `구독 ${n}`, maskedKilled: (n: number) => `해지 ${n}` };
const decode = (hash: string) => decodeReceiptShare(hash, labels, NOW);

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

/** buildReceipt처럼 합계·건수를 줄에서 센 영수증. */
function receipt(lines: ReceiptLine[] = defaultLines()): Receipt {
  const sum = (pick: (l: ReceiptLine) => number) => lines.reduce((s, l) => s + pick(l), 0);
  return {
    period: { kind: "month", year: 2026, month: 9 },
    isComplete: true,
    lines,
    totalKRW: sum((l) => l.amountKRW),
    billedTotalKRW: sum((l) => l.billedKRW),
    chargeCount: sum((l) => l.chargeDates.length),
    upcomingCount: sum((l) => l.upcomingDates.length),
    evidencedCount: sum((l) => l.evidencedDates.length),
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
    line({ name: "Claude Pro", amountKRW: 29811, billedKRW: 29811 }),
    line({
      subscriptionId: "sub-yt",
      name: "유튜브 프리미엄",
      chargeDates: ["2026-09-12"],
      amountKRW: 3725,
      billedKRW: 14900,
      shared: true,
      usage: null,
    }),
  ];
}

const issuedAt = new Date("2026-10-01T00:00:00.000Z");

/** 링크 안의 날 값(JSON)을 꺼낸다 — 링크에 무엇이 실렸는지 보려고. */
function rawWire(hash: string): Record<string, unknown> {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("r")!;
  const dot = value.indexOf(".");
  const bytes = Buffer.from(value.slice(dot + 1), "base64url");
  const json = value.slice(0, dot).endsWith("z") ? inflateRawSync(bytes) : bytes;
  return JSON.parse(json.toString("utf8")) as Record<string, unknown>;
}

const plainLink = (wire: unknown) =>
  `r=${String((wire as { v?: unknown }).v)}.${Buffer.from(JSON.stringify(wire)).toString("base64url")}`;

/** 고치지 않은 3판 링크의 값. */
const baseWire = () => ({
  v: 3,
  p: { kind: "month", year: 2026, month: 9 },
  c: 1,
  l: [
    ["넷플릭스", ["2026-09-03", "2026-09-28"], ["2026-09-28"], [], 34000, "monthly", null],
  ] as unknown[][],
  t: 34000,
  n: [2, 1, 0],
  d: [0, 0],
  k: [] as unknown[],
  fx: [0, 0],
  x: [0, 0, 0],
  i: issuedAt.toISOString(),
  th: "classic",
});

describe("영수증 공유 링크", () => {
  it("영수증을 링크로 옮겼다 그대로 되살린다", async () => {
    const hash = await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "pass" });
    expect(hash).toMatch(/^r=3z?\.[A-Za-z0-9_-]+$/);
    const shared = await decode(`#${hash}`);
    expect(shared?.theme).toBe("pass");
    expect(shared?.issuedAt.toISOString()).toBe(issuedAt.toISOString());
    expect(shared?.render).toEqual({ unverified: true });
    const back = shared!.receipt;
    expect(back.lines.map((l) => [l.name, l.amountKRW])).toEqual([
      ["Claude Pro", 29811],
      ["유튜브 프리미엄", 3725],
    ]);
    expect(back.totalKRW).toBe(33536);
    expect(back.killed.map((k) => [k.name, k.killedOn])).toEqual([["티빙", "2026-09-10"]]);
  });

  it("사용 횟수·1회 단가·나눠 내는 금액·구독 ID·아이콘 주소는 링크에 싣지 않는다", async () => {
    const hash = (await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" }))!;
    const raw = JSON.stringify(rawWire(hash));
    for (const secret of ["4250", "14900", "sub-", "tracker.example", "checkedAt"]) {
      expect(raw).not.toContain(secret);
    }
    const back = (await decode(hash))!.receipt;
    expect(back.priciestPerUse).toBeNull();
    for (const l of back.lines) {
      expect(l).toMatchObject({ usage: null, shared: false, billedKRW: l.amountKRW });
      expect(l.iconUrl).toBeUndefined();
    }
  });

  describe("가림 모드", () => {
    it("합계만 싣는다 — 구독별 줄·해지 목록·지킨 돈·구독 수·건수·환율·빠진 구독 수는 싣지 않는다", async () => {
      const hash = (await encodeReceiptShare(
        { receipt: receipt(), issuedAt, theme: "classic" },
        { maskNames: true },
      ))!;
      const wire = rawWire(hash);
      expect(wire).toMatchObject({
        v: 3,
        l: [],
        k: [],
        h: 0,
        t: 33536,
        n: [0, 0, 0],
        d: [0, 0],
        fx: [0, 0],
        x: [0, 0, 0],
      });
      const raw = JSON.stringify(wire);
      for (const secret of ["Claude", "유튜브", "티빙", "29811", "3725", "9900", "2026-09-03"]) {
        expect(raw).not.toContain(secret);
      }
      const shared = (await decode(hash))!;
      expect(shared.receipt).toMatchObject({
        lines: [],
        killed: [],
        totalKRW: 33536,
        chargeCount: 0,
        defendedKRW: 0,
      });
      expect(shared.render).toEqual({ unverified: true, hidden: true });
    });

    it("결제 예정이 있었는지는 남긴다 — 합계가 '결제 예정 포함'인지가 달라진다", async () => {
      const withUpcoming = receipt([
        line({ chargeDates: ["2026-09-03", "2026-09-28"], upcomingDates: ["2026-09-28"] }),
      ]);
      const hash = (await encodeReceiptShare(
        { receipt: { ...withUpcoming, isComplete: false }, issuedAt, theme: "classic" },
        { maskNames: true },
      ))!;
      expect(rawWire(hash)).toMatchObject({ n: [0, 1, 0] });
      const shared = (await decode(hash))!;
      expect(shared.receipt.upcomingCount).toBe(1);
      expect(receiptFootnotes(messages.ko, shared.receipt, shared.render)).toContain(
        messages.ko.receiptView.notes.incompleteUpcoming,
      );
    });

    it("받는 쪽 그림·글도 합계만 적는다", async () => {
      const t = messages.ko;
      const shown = shareableReceipt(receipt(), { maskNames: true }, labels);
      const text = formatReceiptShareText(t, shown.receipt, shown.render);
      expect(text).toContain(t.receiptView.shared.hiddenSummary);
      expect(text).toContain("₩33,536");
      expect(text).not.toContain(t.receiptView.empty);
      expect(text).not.toMatch(/Claude|유튜브|29,811|지킨 돈|d+건|d+개/);

      const art = receiptArt(t, shown.receipt, issuedAt, shown.render);
      expect(art.totalLabel).toBe(t.receiptView.share.total);
      expect(art.countText).toBe(t.receiptView.shared.hiddenValue);
      expect(art.extras).toEqual([]);
      expect(art.notes).toEqual([t.receiptView.shared.unverifiedMark, t.receiptView.notes.base]);
    });

    it("구독 수를 실은 예전 가림 링크도 받는 쪽에서는 합계만 보인다", async () => {
      const old = {
        ...baseWire(),
        l: [],
        h: 3,
        n: [3, 1, 0],
        d: [9900, 1],
        fx: [2, 0],
        x: [0, 1, 0],
      };
      const shared = (await decode(plainLink(old)))!;
      expect(shared.receipt).toMatchObject({
        chargeCount: 0,
        upcomingCount: 1,
        defendedKRW: 0,
        defendedUnknownCount: 0,
        fx: { historical: 0, current: 0 },
        excluded: { undated: 0, beforeRegistration: 0, trial: 0 },
      });
      expect(shared.render).toEqual({ unverified: true, hidden: true });
    });

    it("가림 표시가 있는데 줄이 실렸거나 구독 수가 상한을 넘으면 받지 않는다", async () => {
      const masked = { ...baseWire(), h: 1 };
      expect(await decode(plainLink({ ...masked, l: [], t: 34000 }))).not.toBeNull();
      expect(await decode(plainLink(masked))).toBeNull();
      expect(await decode(plainLink({ ...masked, l: [], h: MAX_SHARE_LINES + 1 }))).toBeNull();
      expect(await decode(plainLink({ ...masked, l: [], h: 1.5 }))).toBeNull();
    });
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
      expect((await decode(hash))!.receipt.lines[0].name).toBe("구독 1");

      const forged = baseWire();
      forged.l[0][0] = name;
      expect(await decode(plainLink(forged)), name).toBeNull();
    }
  });

  it("서비스 목록의 이름은 연락처로 보지 않는다", () => {
    const names = POPULAR_SERVICES.flatMap((s) => [s.name, s.nameKo, s.nameEn ?? s.nameKo]);
    expect(names.filter(looksLikeContact)).toEqual([]);
    expect(Math.max(...names.map((n) => n.length))).toBeLessThanOrEqual(60);
  });

  describe("고친 링크", () => {
    const wrap = (edit: (wire: ReturnType<typeof baseWire>) => unknown) =>
      decode(plainLink(edit(baseWire()) as { v: unknown }));

    it("고치지 않은 링크는 그린다", async () => {
      expect(await wrap((w) => w)).not.toBeNull();
    });

    it("합계·건수가 줄에서 다시 센 값과 다르면 받지 않는다", async () => {
      expect(await wrap((w) => ({ ...w, t: 1 }))).toBeNull();
      expect(await wrap((w) => ({ ...w, n: [99, 1, 0] }))).toBeNull();
      expect(await wrap((w) => ({ ...w, n: [2, 0, 0] }))).toBeNull();
      expect(await wrap((w) => ({ ...w, n: [2, 1, 1] }))).toBeNull();
    });

    it("달력에 없거나 영수증 기간 밖의 날짜는 받지 않는다", async () => {
      const withDates = (
        charge: string[],
        upcoming: string[] = [],
        killedOn: string | null = null,
      ) =>
        wrap((w) => ({
          ...w,
          l: [["넷플릭스", charge, upcoming, [], 34000, "monthly", killedOn]],
          n: [charge.length, upcoming.length, 0],
        }));
      expect(await withDates(["2026-09-03"])).not.toBeNull();
      expect(await withDates(["2026-13-45"])).toBeNull();
      expect(await withDates(["2026-09-31"])).toBeNull();
      expect(await withDates(["2026-02-29"])).toBeNull();
      expect(await withDates(["2019-01-01"])).toBeNull();
      expect(await withDates(["2026-10-01"])).toBeNull();
      // 결제 예정은 결제일 가운데 있어야 한다
      expect(await withDates(["2026-09-03"], ["2026-09-20"])).toBeNull();
      expect(await withDates(["2026-09-03"], [], "2026-08-31")).toBeNull();
      expect(await wrap((w) => ({ ...w, k: [["티빙", "2026-10-02"]] }))).toBeNull();
    });

    it("금액·발행일이 범위 밖이면 받지 않는다", async () => {
      const amount = (value: number) =>
        wrap((w) => ({
          ...w,
          l: [["넷플릭스", ["2026-09-03"], [], [], value, "monthly", null]],
          t: value,
          n: [1, 0, 0],
        }));
      // 나눠 내는 몫은 소수일 수 있다
      expect(await amount(5666.666666666667)).not.toBeNull();
      expect(await amount(100_000_001)).toBeNull();
      expect(await amount(-1)).toBeNull();
      expect(await wrap((w) => ({ ...w, i: "2026-08-20T00:00:00.000Z" }))).toBeNull();
      // 시간대가 달라 받는 쪽에서는 기간 시작 몇 시간 전으로 보이는 것은 받는다
      const hourBefore = new Date(new Date(2026, 8, 1).getTime() - 60 * 60 * 1000).toISOString();
      expect(await wrap((w) => ({ ...w, i: hourBefore }))).not.toBeNull();
      expect(await wrap((w) => ({ ...w, i: "9999-12-31T00:00:00.000Z" }))).toBeNull();
      expect(await wrap((w) => ({ ...w, d: [2e9, 0] }))).toBeNull();
    });

    it("칸 모양이 틀리면 받지 않는다", async () => {
      expect(await wrap((w) => ({ ...w, th: 'pass" onload="x' }))).toBeNull();
      expect(await wrap((w) => ({ ...w, p: { kind: "month", year: 2026, month: 13 } }))).toBeNull();
      expect(
        await wrap((w) => ({ ...w, l: [[{ a: 1 }, ["2026-09-03"], [], [], 1, "monthly", null]] })),
      ).toBeNull();
      expect(
        await wrap((w) => ({
          ...w,
          l: [["x".repeat(61), ["2026-09-03"], [], [], 1, "monthly", null]],
        })),
      ).toBeNull();
      expect(await wrap((w) => [w])).toBeNull();
    });

    it("1판, 판 번호가 접두사와 다른 것, 너무 긴 링크는 받지 않는다", async () => {
      expect(await decode("r=1z.AAAA")).toBeNull();
      expect(await decode(plainLink({ ...baseWire(), v: 1 }))).toBeNull();
      const inner3 = Buffer.from(JSON.stringify(baseWire())).toString("base64url");
      expect(await decode(`r=2.${inner3}`)).toBeNull();
      expect(await decode(`r=3.${"A".repeat(20_000)}`)).toBeNull();
    });
  });

  it("아직 내보내지 않은 v60 앱이 만든 2판 링크도 같은 검사로 읽는다", async () => {
    const v2 = {
      ...baseWire(),
      v: 2,
      l: [[null, ["2026-09-03"], [], [], 34000, "monthly", null]],
      n: [1, 0, 0],
    };
    const shared = await decode(plainLink(v2));
    expect(shared?.receipt.lines[0].name).toBe("구독 1");
    expect(await decode(plainLink({ ...v2, t: 1 }))).toBeNull();
    // 2판에는 가림 요약이 없다
    expect(
      (await decode(plainLink({ ...v2, l: [], n: [0, 0, 0], t: 0, h: 3 })))?.render.hidden,
    ).toBeUndefined();
  });

  it("buildReceipt가 만든 영수증은 고친 링크로 보지 않는다 — 나눠 낸 소수 몫·달러·연간·결제 예정·해지", async () => {
    const now = new Date(2026, 8, 27, 9, 0);
    const base = {
      currency: "KRW" as const,
      billingDay: 10,
      billingCycle: "monthly" as const,
      category: "ott" as const,
      status: "active" as const,
      createdAt: new Date(2026, 0, 1).toISOString(),
    };
    const subs: Subscription[] = [
      { ...base, id: "a", name: "넷플릭스", amount: 17000, sharingCount: 3 },
      {
        ...base,
        id: "b",
        name: "Claude Pro",
        amount: 20,
        currency: "USD",
        taxRate: 10,
        billingDay: 3,
      },
      { ...base, id: "c", name: "왓챠", amount: 7900, billingDay: 30 },
      { ...base, id: "d", name: "굿노트", amount: 13000, billingCycle: "yearly", billingMonth: 3 },
      {
        ...base,
        id: "e",
        name: "티빙",
        amount: 9500,
        status: "killed",
        killedAt: new Date(2026, 8, 15).toISOString(),
      },
    ];
    for (const period of [
      { kind: "month", year: 2026, month: 9 },
      { kind: "year", year: 2026 },
    ] as const) {
      const built = buildReceipt(subs, [], period, 1387.5, now);
      expect(built.lines.length).toBeGreaterThan(1);
      for (const maskNames of [false, true]) {
        const hash = (await encodeReceiptShare(
          { receipt: built, issuedAt: now, theme: "classic" },
          { maskNames },
        ))!;
        const back = await decodeReceiptShare(hash, labels, now);
        expect(back, `${period.kind} 가림=${maskNames}`).not.toBeNull();
        expect(back!.receipt.totalKRW).toBe(built.totalKRW);
        // 가리면 건수는 싣지 않는다(합계만)
        expect(back!.receipt.chargeCount).toBe(maskNames ? 0 : built.chargeCount);
      }
    }
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
    expect(await decode(plainLink(forged))).toBeNull();
  });

  it("작게 압축해 크게 풀리는 링크는 상한에서 멈춘다", async () => {
    const bomb = deflateRawSync(Buffer.alloc(5 * 1024 * 1024, 0x20)).toString("base64url");
    expect(bomb.length).toBeLessThan(10_000);
    expect(await decode(`r=3z.${bomb}`)).toBeNull();
  });

  it("틀리거나 잘린 링크는 그리지 않는다", async () => {
    const hash = (await encodeReceiptShare({ receipt: receipt(), issuedAt, theme: "classic" }))!;
    expect(await decode("")).toBeNull();
    expect(await decode("#r=")).toBeNull();
    expect(await decode("#r=9.abc")).toBeNull();
    expect(await decode(hash.slice(0, hash.length - 20))).toBeNull();
    expect(await decode("#r=3.<script>")).toBeNull();
  });

  it("아무렇게나 바꾼 링크에도 예외를 던지지 않는다", async () => {
    let seed = 7;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    const junk = [null, -1, 1e20, NaN, "", "<img src=x onerror=alert(1)>", [], {}, [[]], true];
    const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
    for (let round = 0; round < 300; round++) {
      const wire = JSON.parse(JSON.stringify(baseWire())) as Record<string, unknown>;
      wire[pick(Object.keys(wire).filter((k) => k !== "v"))] = pick(junk);
      // 바꾼 값이 우연히 맞는 모양일 수도 있다(해지 목록을 빈 배열로). 그럴 때는 온전한 영수증이어야 한다.
      const shared = await decode(plainLink(wire as { v: unknown }));
      if (shared) {
        expect(Array.isArray(shared.receipt.lines)).toBe(true);
        expect(Number.isFinite(shared.receipt.totalKRW)).toBe(true);
      }
      const bytes = Buffer.from(
        Array.from({ length: 1 + Math.floor(rand() * 200) }, () => Math.floor(rand() * 256)),
      );
      await expect(decode(`r=3z.${bytes.toString("base64url")}`)).resolves.toBeNull();
    }
  });

  it("공유받은 영수증은 '확인되지 않은 내용'을 맨 앞에 적고 '체크인 없음'이라고 하지 않는다", () => {
    const t = messages.ko;
    const notes = receiptFootnotes(t, receipt(), { unverified: true });
    expect(notes[0]).toBe(t.receiptView.shared.unverifiedMark);
    expect(receiptFootnotes(t, receipt())).not.toContain(t.receiptView.shared.unverifiedMark);
    const noUsage = line({ usage: null });
    const period = { kind: "month", year: 2026, month: 9 } as const;
    expect(describeReceiptLine(t, noUsage, period)).toContain(t.receiptView.line.noCheckIn);
    expect(describeReceiptLine(t, noUsage, period, { unverified: true })).not.toContain(
      t.receiptView.line.noCheckIn,
    );
  });
});
