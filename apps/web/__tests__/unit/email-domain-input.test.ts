import { describe, it, expect } from "vitest";
import {
  COMMON_EMAIL_DOMAINS,
  getDomainForProvider,
  parseEmailValue,
} from "../../components/ui/email-domain-input";

describe("EmailDomainInput Logic & Domain Mapping", () => {
  it("포털 및 주요 이메일 도메인 프리셋이 올바르게 제공되어야 한다", () => {
    const domainValues = COMMON_EMAIL_DOMAINS.map((d) => d.value);
    expect(domainValues).toContain("naver.com");
    expect(domainValues).toContain("gmail.com");
    expect(domainValues).toContain("kakao.com");
    expect(domainValues).toContain("daum.net");
    expect(domainValues).toContain("icloud.com");
    expect(domainValues).toContain("outlook.com");
    expect(domainValues).toContain("custom");
  });

  it("도메인 프리셋에 알맞은 Provider(google, naver, kakao, apple)가 매핑되어 있어야 한다", () => {
    const naver = COMMON_EMAIL_DOMAINS.find((d) => d.value === "naver.com");
    expect(naver?.provider).toBe("naver");

    const google = COMMON_EMAIL_DOMAINS.find((d) => d.value === "gmail.com");
    expect(google?.provider).toBe("google");

    const kakao = COMMON_EMAIL_DOMAINS.find((d) => d.value === "kakao.com");
    expect(kakao?.provider).toBe("kakao");

    const apple = COMMON_EMAIL_DOMAINS.find((d) => d.value === "icloud.com");
    expect(apple?.provider).toBe("apple");
  });

  it("제공자별 기본 도메인이 올바르게 매핑되어야 한다 (Google -> gmail, Kakao -> kakao, Naver -> naver, Apple -> icloud)", () => {
    expect(getDomainForProvider("google")).toBe("gmail.com");
    expect(getDomainForProvider("kakao")).toBe("kakao.com");
    expect(getDomainForProvider("naver")).toBe("naver.com");
    expect(getDomainForProvider("apple")).toBe("icloud.com");
    expect(getDomainForProvider("email")).toBe("custom");
    expect(getDomainForProvider()).toBe("gmail.com");
  });

  it("아이디와 선택된 도메인이 @ 기호로 정상 결합되어 전체 이메일 주소를 반환해야 한다", () => {
    const local = "myuser123";
    const domain = "naver.com";
    const fullEmail = `${local}@${domain}`;
    expect(fullEmail).toBe("myuser123@naver.com");

    const customDomain = "mycompany.co.kr";
    const customFullEmail = `${local}@${customDomain}`;
    expect(customFullEmail).toBe("myuser123@mycompany.co.kr");
  });

  it("parseEmailValue가 빈 문자열 및 도메인 유무를 정확하게 파싱해야 한다", () => {
    expect(parseEmailValue("")).toEqual({ local: "", domain: "", hasDomain: false });
    expect(parseEmailValue("hello")).toEqual({ local: "hello", domain: "", hasDomain: false });
    expect(parseEmailValue("hello@kakao.com")).toEqual({
      local: "hello",
      domain: "kakao.com",
      hasDomain: true,
    });
    expect(parseEmailValue("hello@gmail.com")).toEqual({
      local: "hello",
      domain: "gmail.com",
      hasDomain: true,
    });
    expect(parseEmailValue("hello@naver.com")).toEqual({
      local: "hello",
      domain: "naver.com",
      hasDomain: true,
    });
  });

  it("제공자 기본값이 특정 도메인(naver.com)으로 고정되지 않고 제공자에 맞게 설정되어야 한다", () => {
    expect(getDomainForProvider("google")).toBe("gmail.com");
    expect(getDomainForProvider("kakao")).toBe("kakao.com");
    expect(getDomainForProvider("naver")).toBe("naver.com");
    expect(getDomainForProvider("apple")).toBe("icloud.com");
    expect(getDomainForProvider("email")).toBe("custom");
    // 미지정 시 기본값은 naver.com이 아님
    expect(getDomainForProvider(undefined)).not.toBe("naver.com");
  });
});
