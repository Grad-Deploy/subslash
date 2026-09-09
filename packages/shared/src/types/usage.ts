import { RiskLevel } from "./subscription";

export interface UsageLog {
  id: string;
  subscriptionId: string;
  month: string;
  usageCount: number;
  costPerUse: number;
  riskLevel: RiskLevel;
  checkedAt: string;
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
