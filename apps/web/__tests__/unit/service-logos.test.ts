import { existsSync } from "fs";
import path from "path";

import { describe, it, expect } from "vitest";
import { POPULAR_SERVICES } from "@subslash/shared";

import { BRAND_LOGOS, contrastRatio, foregroundOn, NEUTRAL_LOGO_HEX } from "@lib/service-logos";

describe("서비스 로고", () => {
  it("서비스 목록의 모든 서비스에 로고가 있다", () => {
    const missing = POPULAR_SERVICES.filter((preset) => !BRAND_LOGOS[preset.id]).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it("로고 목록에 서비스 목록에 없는 id가 남아 있지 않다", () => {
    const ids = new Set(POPULAR_SERVICES.map((preset) => preset.id));
    expect(Object.keys(BRAND_LOGOS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("항목마다 글리프·앱 아이콘·이니셜 중 하나만 갖는다", () => {
    for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
      const kinds = [logo.path, logo.image, logo.initial].filter(Boolean);
      expect(kinds.length, `${id}가 어떻게 그려질지 분명하지 않다`).toBe(1);
    }
  });

  describe("공식 앱 아이콘", () => {
    it("적어 둔 경로에 파일이 실제로 있다", () => {
      for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
        if (!logo.image) continue;
        expect(logo.image, `${id}의 경로`).toMatch(/^\/logos\/[a-z0-9-]+\.png$/);
        const file = path.join(process.cwd(), "public", logo.image);
        expect(existsSync(file), `${id}: ${logo.image} 파일이 없다`).toBe(true);
      }
    });

    it("어디서 받아 온 아이콘인지 적어 둔다", () => {
      for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
        if (!logo.image) continue;
        expect(logo.source, `${id}의 아이콘 출처`).toBeTruthy();
      }
    });
  });

  it("글리프를 옮겨 온 서비스는 원본에서의 이름을 함께 적는다", () => {
    for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
      if (!logo.path) continue;
      expect(logo.title, `${id}의 글리프 출처`).toBeTruthy();
    }
  });

  it("이니셜은 타일에 들어가는 길이다", () => {
    for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
      if (!logo.initial) continue;
      expect(logo.initial.length, `${id}의 글자가 타일에 넘친다`).toBeLessThanOrEqual(3);
    }
  });

  it("브랜드 색은 #RRGGBB로 적고, 확인하지 못했으면 아예 비운다", () => {
    for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
      if (logo.hex === undefined) continue;
      expect(logo.hex, `${id}의 색 형식`).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  describe("타일 위 글자 색", () => {
    it("어두운 브랜드 색에는 흰 글자를 얹는다", () => {
      expect(foregroundOn("#E50914")).toBe("#FFFFFF"); // 넷플릭스
      expect(foregroundOn("#000000")).toBe("#FFFFFF"); // 노션
      expect(foregroundOn("#0C2836")).toBe("#FFFFFF"); // 디즈니플러스
    });

    it("밝은 브랜드 색에는 어두운 글자를 얹는다", () => {
      expect(foregroundOn("#FFF500")).toBe("#18181B");
      expect(foregroundOn("#0CEFD3")).toBe("#18181B");
      expect(foregroundOn("#FFCD00")).toBe("#18181B"); // 카카오
    });

    it("타일로 그리는 모든 로고가 글자와 충분한 대비를 갖는다", () => {
      for (const [id, logo] of Object.entries(BRAND_LOGOS)) {
        if (logo.image) continue; // 앱 아이콘은 제 배경을 갖고 온다
        const background = logo.hex ?? NEUTRAL_LOGO_HEX;
        // 로고는 큰 그래픽이라 3:1이면 형체가 보인다(WCAG 1.4.11).
        expect(contrastRatio(background, foregroundOn(background)), `${id}의 대비`).toBeGreaterThan(
          3,
        );
      }
    });
  });
});
