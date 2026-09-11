import { describe, it, expect, vi } from "vitest";
import { checkEmailDomain, emailDomainMessage, type DomainResolver } from "../../lib/email-domain";

/** Node DNS가 던지는 것과 같은 모양(code가 붙은 Error)을 만든다. */
function dnsError(code: string) {
  return Object.assign(new Error(`query failed: ${code}`), { code });
}

type MxRecord = { exchange: string; priority: number };

/** 적지 않은 레코드는 "그런 레코드 없음(ENODATA)"으로 답한다. 실제 네트워크는 쓰지 않는다. */
function fakeResolver(answers: {
  mx?: MxRecord[] | Error;
  a?: string[] | Error;
  aaaa?: string[] | Error;
}): DomainResolver {
  function reply<T>(answer: T | Error | undefined): Promise<T> {
    if (answer === undefined) return Promise.reject(dnsError("ENODATA"));
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  }
  return {
    resolveMx: () => reply(answers.mx),
    resolve4: () => reply(answers.a),
    resolve6: () => reply(answers.aaaa),
  };
}

describe("checkEmailDomain", () => {
  it("메일 서버(MX)가 있으면 통과시킨다", async () => {
    const resolver = fakeResolver({ mx: [{ exchange: "mx1.naver.com", priority: 10 }] });
    expect(await checkEmailDomain("naver.com", resolver)).toEqual({ ok: true });
  });

  it("존재하지 않는 도메인은 not-found", async () => {
    const resolver = fakeResolver({ mx: dnsError("ENOTFOUND") });
    expect(await checkEmailDomain("gmial-typo.com", resolver)).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("메일을 받지 않는다고 선언한 도메인(null MX)은 no-mail", async () => {
    // example.com이 실제로 이렇게 선언돼 있다.
    const resolver = fakeResolver({ mx: [{ exchange: "", priority: 0 }] });
    expect(await checkEmailDomain("example.com", resolver)).toEqual({
      ok: false,
      reason: "no-mail",
    });
  });

  it("MX가 없어도 도메인 주소(A)가 있으면 그리로 배달되므로 통과시킨다", async () => {
    const resolver = fakeResolver({ a: ["203.0.113.10"] });
    expect(await checkEmailDomain("small-company.kr", resolver)).toEqual({ ok: true });
  });

  it("MX도 주소도 없는 도메인은 no-mail", async () => {
    expect(await checkEmailDomain("parked.com", fakeResolver({}))).toEqual({
      ok: false,
      reason: "no-mail",
    });
  });

  it("조회가 시간 초과되면 잘못된 도메인이라고 단정하지 않는다", async () => {
    const resolver = fakeResolver({ mx: dnsError("ETIMEOUT") });
    expect(await checkEmailDomain("gmail.com", resolver)).toEqual({
      ok: false,
      reason: "unverifiable",
      detail: "ETIMEOUT",
    });
  });

  it("MX는 없고 주소 조회가 실패하면 역시 단정하지 않는다", async () => {
    const resolver = fakeResolver({ a: dnsError("ESERVFAIL") });
    expect(await checkEmailDomain("small-company.kr", resolver)).toEqual({
      ok: false,
      reason: "unverifiable",
      detail: "ESERVFAIL",
    });
  });
});

describe("checkEmailDomain — 시스템 DNS에 닿지 못할 때", () => {
  it("연결이 거부되면(ECONNREFUSED) 예비 DNS로 한 번 더 묻는다", async () => {
    const primary = fakeResolver({ mx: dnsError("ECONNREFUSED") });
    const fallback = fakeResolver({
      mx: [{ exchange: "gmail-smtp-in.l.google.com", priority: 5 }],
    });
    expect(await checkEmailDomain("gmail.com", primary, () => fallback)).toEqual({ ok: true });
  });

  it("예비 DNS가 내린 판정을 그대로 따른다", async () => {
    const primary = fakeResolver({ mx: dnsError("ECONNREFUSED") });
    const fallback = fakeResolver({ mx: dnsError("ENOTFOUND") });
    expect(await checkEmailDomain("gmial-typo.com", primary, () => fallback)).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("시간 초과 같은 다른 실패에는 다시 묻지 않는다", async () => {
    const fallback = vi.fn(() => fakeResolver({ mx: [{ exchange: "mx.example", priority: 1 }] }));
    const result = await checkEmailDomain(
      "gmail.com",
      fakeResolver({ mx: dnsError("ETIMEOUT") }),
      fallback,
    );
    expect(result).toEqual({ ok: false, reason: "unverifiable", detail: "ETIMEOUT" });
    expect(fallback).not.toHaveBeenCalled();
  });

  it("예비 DNS에도 닿지 못하면 단정하지 않는다", async () => {
    const refused = () => fakeResolver({ mx: dnsError("ECONNREFUSED") });
    expect(await checkEmailDomain("gmail.com", refused(), refused)).toEqual({
      ok: false,
      reason: "unverifiable",
      detail: "ECONNREFUSED",
    });
  });
});

describe("emailDomainMessage", () => {
  it("잘못된 도메인이면 그 도메인을 짚어준다", () => {
    expect(emailDomainMessage("gmial-typo.com", "not-found")).toContain("gmial-typo.com");
    expect(emailDomainMessage("example.com", "no-mail")).toContain("example.com");
  });

  it("조회 실패는 도메인 탓으로 돌리지 않는다", () => {
    const message = emailDomainMessage("gmail.com", "unverifiable");
    expect(message).not.toContain("존재하지 않는");
    expect(message).not.toContain("gmail.com");
  });
});
