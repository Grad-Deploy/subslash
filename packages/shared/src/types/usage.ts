import { RiskLevel } from "./subscription";
import type { CheckInOutcome } from "../utils/valueMetric";

/**
 * 체크인한 기기. 로그인한 기기끼리 기록을 맞추면 체크인이 여러 기기에서 섞이므로, 어디서 센 숫자인지 알아볼 수 있게
 * 남긴다. 기기를 알아보는 값(기기 ID·모델·이름)은 남기지 않는다 — `id`는 이 브라우저·앱 설치마다 처음 만든 무작위
 * 값이라, 같은 기기인지만 견줄 수 있다(브라우저 데이터를 지우면 새 값이 된다).
 */
export interface CheckInDevice {
  /** 앱(안드로이드·iOS)에서 적었는지, 웹에서 적었는지. */
  app: "web" | "android" | "ios";
  /** 운영체제. 알아보지 못하면 `other`. */
  os: "windows" | "mac" | "linux" | "chromeos" | "android" | "ios" | "other";
  /** 휴대폰·태블릿처럼 작은 기기인지. */
  mobile: boolean;
  id: string;
}

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
  /**
   * 이 체크인을 평가할 때 쓴 "무료 요금제로 충분했나"의 답(구독의 `freeTierAnswer`를 그때 옮겨 둔 것).
   * 묻지 않는 구독이거나 답하지 않았으면 없다. `riskLevel`이 왜 노랑인지 나중에 읽을 수 있게 남긴다.
   */
  freeTier?: "needed" | "enough" | "unsure";
  /**
   * PC의 Claude Code·Codex 기록에서 본 근거(웹 /pc-usage에서 체크인했을 때만). 구독으로 쓴 토큰 수와, 같은 모델을
   * API로 썼다면 냈을 요금표 가격(USD, 모르면 null). PC 기록뿐이라 웹·앱 사용은 빠진 하한값이다 — 위험도를
   * 올리는 데만 쓴다(utils/valueMetric).
   */
  tokens?: { count: number; apiUsd: number | null };
  /** 체크인한 기기. 이 기능 전의 체크인과 기기를 알 수 없을 때(서버 렌더링 중 등)는 없다. */
  device?: CheckInDevice;
}

export interface CheckInResponse {
  costPerUse: number;
  riskLevel: RiskLevel;
  /** 결과 문장에 들어갈 값. 문장은 화면이 만든다. */
  outcome: CheckInOutcome;
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
