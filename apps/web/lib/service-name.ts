import type { ServicePreset } from "@subslash/shared";

/** 탭·타일·목록처럼 좁은 자리에 쓰는 서비스 이름. 괄호 속 부연("쿠팡 와우 (쿠팡플레이)")을 뺀다. */
export function shortServiceName(preset: ServicePreset): string {
  return preset.nameKo.replace(/\s*\(.*\)$/, "");
}
