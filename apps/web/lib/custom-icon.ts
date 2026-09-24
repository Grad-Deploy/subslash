/**
 * 목록에 없는 서비스를 직접 등록할 때 고르는 아이콘(이모지)과 타일 색.
 *
 * 브랜드 마크를 지어내지 않는다는 원칙(lib/service-logos) 때문에, 직접 등록한 구독은 사용자가
 * 고른 이모지와 색으로만 알아보게 한다. 색은 hex가 아니라 이름으로 저장해, 백업·계정 저장에서
 * 받은 값을 이 목록으로 검사할 수 있게 한다(lib/backup).
 */

export const CUSTOM_ICON_COLORS = [
  { id: "gray", hex: "#71717a", label: "회색" },
  { id: "red", hex: "#ef4444", label: "빨강" },
  { id: "orange", hex: "#f97316", label: "주황" },
  { id: "yellow", hex: "#eab308", label: "노랑" },
  { id: "green", hex: "#22c55e", label: "초록" },
  { id: "blue", hex: "#3b82f6", label: "파랑" },
  { id: "violet", hex: "#8b5cf6", label: "보라" },
] as const;

export type CustomIconColor = (typeof CUSTOM_ICON_COLORS)[number]["id"];

export const CUSTOM_ICON_EMOJIS = ["🏋️", "📚", "☁️", "🎮", "📰", "🍱", "🚗", "📦"] as const;

export function isCustomIconColor(value: unknown): value is CustomIconColor {
  return CUSTOM_ICON_COLORS.some((c) => c.id === value);
}

/** 저장된 색 이름의 hex. 모르는 값이면 undefined — 호출하는 쪽이 중립 타일로 그린다. */
export function customIconHex(id: string | undefined): string | undefined {
  return CUSTOM_ICON_COLORS.find((c) => c.id === id)?.hex;
}
