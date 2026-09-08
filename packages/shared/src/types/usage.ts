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
  totalMonthlySpend: number;
  activeCount: number;
  killedCount: number;
  totalSaved: number;
  atRiskCount: number;
}
