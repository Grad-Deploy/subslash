import { describe, expect, it } from "vitest";
import {
  DEMO_SUBSCRIPTIONS,
  POPULAR_SERVICES,
  findPresetForSubscription,
  isSameService,
  serviceNameKey,
} from "@subslash/shared";
import {
  PLAN_NAMES_EN,
  planName,
  presetName,
  serviceIdName,
  shortServiceName,
  subscriptionName,
} from "@lib/service-name";

const HANGUL = /[가-힣]/;
const preset = (id: string) => POPULAR_SERVICES.find((service) => service.id === id)!;

describe("서비스 이름의 영문 표기", () => {
  it("영어 화면은 영문 표기를, 한국어 화면은 한국어 이름을 보인다", () => {
    expect(presetName(preset("netflix"), "en")).toBe("Netflix");
    expect(presetName(preset("netflix"), "ko")).toBe("넷플릭스");
    expect(shortServiceName(preset("coupang-wow"), "en")).toBe("Coupang WOW");
    expect(serviceIdName("apple-icloud", "en")).toBe("iCloud+");
  });

  it("영문 표기가 있는 서비스는 영어 화면에 한글이 남지 않는다", () => {
    for (const service of POPULAR_SERVICES) {
      if (!service.nameEn) continue;
      expect(service.nameEn, service.id).not.toMatch(HANGUL);
    }
  });

  it("요청받은 서비스는 모두 영문 표기가 있다", () => {
    const ids = [
      "netflix",
      "tving",
      "coupang-wow",
      "wavve",
      "watcha",
      "youtube-premium",
      "disney-plus",
      "apple-tv",
      "prime-video",
      "spotify",
      "naver-plus",
      "melon",
      "naver-mybox",
      "kakao-emoticon",
      "apple-icloud",
      "google-one",
      "notion",
      "chatgpt-plus",
      "adobe-cc",
      "microsoft-365",
      "goodnotes",
    ];
    for (const id of ids) expect(presetName(preset(id), "en"), id).not.toMatch(HANGUL);
  });
});

describe("등록한 구독의 화면 이름", () => {
  it("영어 화면은 서비스 목록의 한국어 이름 그대로인 구독을 영문으로 보인다", () => {
    expect(subscriptionName({ name: "넷플릭스" }, "en")).toBe("Netflix");
    expect(subscriptionName({ name: "Netflix" }, "en")).toBe("Netflix");
  });

  // 영어 화면에서 등록하면 영문 이름으로 저장된다. 예전에는 한국어 화면으로 바꿔도 'Netflix'로 남았다.
  it("한국어 화면은 영어 화면에서 등록한 구독을 한국어 이름으로 보인다", () => {
    expect(subscriptionName({ name: "Netflix" }, "ko")).toBe("넷플릭스");
    expect(subscriptionName({ name: "YouTube Premium" }, "ko")).toBe("유튜브 프리미엄");
    expect(subscriptionName({ name: "TVING x Wavve Double Pass" }, "ko")).toBe(
      "티빙 x 웨이브 더블 이용권",
    );
    expect(subscriptionName({ name: "멜론" }, "ko")).toBe("멜론");
  });

  it("언어를 오가도 같은 구독은 같은 이름으로 돌아온다", () => {
    for (const service of POPULAR_SERVICES) {
      for (const stored of [service.nameKo, service.nameEn ?? service.nameKo]) {
        expect(
          subscriptionName({ name: stored, cancelUrl: service.cancelUrl }, "ko"),
          service.id,
        ).toBe(service.nameKo);
        expect(
          subscriptionName({ name: stored, cancelUrl: service.cancelUrl }, "en"),
          service.id,
        ).toBe(service.nameEn ?? service.nameKo);
      }
    }
  });

  it("사용자가 고쳐 적은 이름은 어느 언어에서도 그대로 둔다", () => {
    expect(subscriptionName({ name: "넷플릭스 (가족)" }, "en")).toBe("넷플릭스 (가족)");
    expect(subscriptionName({ name: "내 헬스장" }, "en")).toBe("내 헬스장");
    expect(subscriptionName({ name: "My Netflix" }, "ko")).toBe("My Netflix");
  });

  // 샘플 이름이 목록 이름과 다르면 고쳐 적은 이름으로 읽혀, 영어 화면에서도 한국어로 남았다('쿠팡 와우 멤버십').
  it("샘플 체험의 구독은 목록의 이름·분류라 두 언어 이름으로 보인다", () => {
    for (const sample of DEMO_SUBSCRIPTIONS) {
      const service = findPresetForSubscription(sample);
      expect(service?.nameKo, sample.name).toBe(sample.name);
      expect(sample.category, sample.name).toBe(service?.category);
      expect(subscriptionName(sample, "en"), sample.name).not.toMatch(HANGUL);
    }
  });

  it("영문 이름으로 저장한 구독도 같은 서비스로 알아본다", () => {
    expect(findPresetForSubscription({ name: "Netflix" })?.id).toBe("netflix");
    expect(serviceNameKey("Netflix")).toBe(serviceNameKey("넷플릭스"));
    expect(
      isSameService({ name: "Netflix", currency: "KRW" }, { name: "넷플릭스", currency: "KRW" }),
    ).toBe(true);
    expect(
      isSameService({ name: "내 헬스장", currency: "KRW" }, { name: "넷플릭스", currency: "KRW" }),
    ).toBe(false);
  });
});

describe("요금제 이름의 영문 표기", () => {
  it("서비스 목록의 한글 요금제 이름은 모두 영문 표기가 있다", () => {
    for (const service of POPULAR_SERVICES) {
      for (const plan of service.plans ?? []) {
        if (!HANGUL.test(plan.name)) continue;
        expect(PLAN_NAMES_EN[plan.name], `${service.id} ${plan.name}`).toBeDefined();
      }
    }
  });

  it("영문 표기에 한글이 남지 않는다", () => {
    for (const [ko, en] of Object.entries(PLAN_NAMES_EN)) expect(en, ko).not.toMatch(HANGUL);
  });

  it("영어 화면에서만 바꾸고, 표에 없는 이름은 그대로 둔다", () => {
    expect(planName("광고형 스탠다드", "en")).toBe("Standard with ads");
    expect(planName("광고형 스탠다드", "ko")).toBe("광고형 스탠다드");
    expect(planName("내가 적은 요금제", "en")).toBe("내가 적은 요금제");
    expect(planName("Pro", "en")).toBe("Pro");
  });
});
