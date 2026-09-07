import { RiskLevel, Currency } from "../types";

export function calculateCostPerUse(amount: number, usageCount: number): number {
  if (usageCount === 0) return amount;
  return amount / usageCount;
}

export function getRiskLevel(costPerUse: number, amount: number, usageCount: number): RiskLevel {
  if (usageCount <= 1 || costPerUse > amount * 0.5) return "red";
  if (usageCount >= 8 || costPerUse <= amount * 0.25) return "green";
  return "yellow";
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "KRW") {
    // The won has no subunit; a divided cost-per-use must not show decimals.
    return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatShockMessage(
  serviceName: string,
  amount: number,
  usageCount: number,
  currency: Currency,
): string {
  const formattedAmount = formatCurrency(amount, currency);

  if (usageCount === 0) {
    return `이번 달 ${formattedAmount}을 공중에 버리셨습니다. 지금 바로 킬(Kill) 스위치를 켜세요.`;
  }

  if (usageCount === 1) {
    return `이번 달 ${serviceName} 1회를 ${formattedAmount}에 이용하셨습니다.`;
  }

  const costPerUseFormatted = formatCurrency(calculateCostPerUse(amount, usageCount), currency);
  return `이번 달 ${serviceName} 1회당 ${costPerUseFormatted}을 지출하셨습니다.`;
}

export function calculateAnnualSavings(monthlyAmount: number): number {
  return monthlyAmount * 12;
}

export function getSavingsEquivalent(annualSavings: number): string[] {
  const equivalents: string[] = [];

  if (annualSavings >= 500000) {
    equivalents.push("해외 여행 1회");
  } else if (annualSavings >= 200000) {
    equivalents.push("고급 레스토랑 저녁 식사 4회");
  } else if (annualSavings >= 100000) {
    equivalents.push("최신 무선 이어폰 1개");
  } else if (annualSavings >= 50000) {
    equivalents.push("맛있는 치킨 5마리");
  } else {
    equivalents.push(`카페 라떼 ${Math.floor(annualSavings / 5000)}잔`);
  }

  return equivalents;
}
