import { RiskLevel } from "./subscription";

export interface UsageLog {
  id: string;
  subscriptionId: string;
  month: string;
  usageCount: number;
  costPerUse: number;
  riskLevel: RiskLevel;
  checkedAt: string;
  /**
   * 누가 센 숫자인지. 없으면 사용자가 직접 체크인한 것이다. `"phone"`은 안드로이드 앱이 이 폰의
   * 사용 기록(최근 30일 동안 연 횟수)으로 자동으로 적은 것이라, TV·PC에서 쓴 것은 빠져 있다.
   */
  source?: "phone";
  /**
   * `usageCount`가 무엇의 수량인지(utils/valueMetric). 없으면 이 기능 전의 체크인이라 횟수(`uses`)다.
   * 구독마다 재는 것이 다르다 — 음악은 시간, AI는 쓴 날, 멤버십은 받은 혜택 금액.
   */
  metric?: "uses" | "days" | "hours" | "benefit" | "storage";
}

export interface CheckInResponse {
  costPerUse: number;
  riskLevel: RiskLevel;
  shockMessage: string;
}

export interface DashboardStats {
  /** What the user personally pays each month, after splitting shared plans. */
  totalMonthlySpend: number;
  /** What the card is charged each month, shared plans included in full. */
  totalMonthlyBilled: number;
  activeCount: number;
  killedCount: number;
  totalSaved: number;
  atRiskCount: number;
}
