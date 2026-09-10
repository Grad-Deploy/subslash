/**
 * 구독 디톡스 레벨.
 *
 * 레벨은 사용자가 실제로 방어한 금액과 해지 건수에서만 나온다. 아직
 * 해지한 구독이 없으면 Lv.0("아직 시작 전")이고, 없는 성취를 만들어
 * 보여주지 않는다.
 */

export interface DetoxLevel {
  /** 0은 아직 해지 이력이 없는 상태, 5는 최고 레벨. */
  level: number;
  /** 화면에 그대로 쓰는 레벨 표기 (예: "Lv.3"). */
  levelLabel: string;
  /** 방어 칭호. */
  title: string;
  emoji: string;
  /** 이 레벨에 들어오기 위해 필요했던 누적 방어액(KRW). */
  minSavings: number;
  /**
   * 다음 레벨의 문턱(KRW). 최고 레벨이면 `null`이고, 이때 화면은
   * 진행률 대신 "최고 레벨"을 보여줘야 한다.
   */
  nextThreshold: number | null;
  /** 다음 레벨 칭호. 최고 레벨이면 `null`. */
  nextTitle: string | null;
  /** 다음 레벨까지 남은 금액(KRW). 최고 레벨이면 `null`. */
  remainingToNext: number | null;
  /** 현재 레벨 구간에서의 진행률(0~100). 최고 레벨이면 100. */
  progressPercent: number;
}

interface LevelTier {
  level: number;
  title: string;
  emoji: string;
  minSavings: number;
}

/**
 * 레벨 구간표. `minSavings`는 누적 방어액(KRW) 기준이고,
 * Lv.1은 금액이 적더라도 한 건이라도 해지했으면 도달한다.
 */
export const DETOX_LEVEL_TIERS: readonly LevelTier[] = [
  { level: 0, title: "디톡스 준비", emoji: "🌱", minSavings: 0 },
  { level: 1, title: "구독 새싹", emoji: "🌿", minSavings: 10000 },
  { level: 2, title: "디톡스 탐험가", emoji: "🧭", minSavings: 50000 },
  { level: 3, title: "스마트 슬래셔", emoji: "✂️", minSavings: 150000 },
  { level: 4, title: "지출 방어 사령관", emoji: "🛡️", minSavings: 300000 },
  { level: 5, title: "구독 킬러 · 미니멀리스트", emoji: "👑", minSavings: 500000 },
] as const;

const MAX_LEVEL = DETOX_LEVEL_TIERS[DETOX_LEVEL_TIERS.length - 1].level;

/**
 * 누적 방어액과 해지 건수로 디톡스 레벨을 계산한다.
 *
 * @param annualSavings 누적 연간 방어액(KRW). 음수나 NaN은 0으로 본다.
 * @param killCount 해지 완료한 구독 수. 1건 이상이면 금액이 문턱에
 *   못 미쳐도 Lv.1로 올린다("첫 해지"라는 성취는 실제로 있었기 때문).
 */
export function getDetoxLevel(annualSavings: number, killCount: number = 0): DetoxLevel {
  const savings = Number.isFinite(annualSavings) && annualSavings > 0 ? annualSavings : 0;
  const kills = Number.isFinite(killCount) && killCount > 0 ? Math.floor(killCount) : 0;

  let tier = DETOX_LEVEL_TIERS[0];
  for (const candidate of DETOX_LEVEL_TIERS) {
    if (savings >= candidate.minSavings) tier = candidate;
  }

  // 방어 1건 이상이면 금액이 1만 원에 못 미쳐도 Lv.1이다.
  if (tier.level === 0 && kills >= 1) {
    tier = DETOX_LEVEL_TIERS[1];
  }

  const nextTier = DETOX_LEVEL_TIERS.find((t) => t.level === tier.level + 1) ?? null;

  if (!nextTier || tier.level >= MAX_LEVEL) {
    return {
      level: tier.level,
      levelLabel: tier.level >= MAX_LEVEL ? "Lv.MAX" : `Lv.${tier.level}`,
      title: tier.title,
      emoji: tier.emoji,
      minSavings: tier.minSavings,
      nextThreshold: null,
      nextTitle: null,
      remainingToNext: null,
      progressPercent: 100,
    };
  }

  const span = nextTier.minSavings - tier.minSavings;
  const earned = Math.max(0, savings - tier.minSavings);
  const progressPercent = span > 0 ? Math.min(100, Math.round((earned / span) * 100)) : 0;

  return {
    level: tier.level,
    levelLabel: `Lv.${tier.level}`,
    title: tier.title,
    emoji: tier.emoji,
    minSavings: tier.minSavings,
    nextThreshold: nextTier.minSavings,
    nextTitle: nextTier.title,
    remainingToNext: Math.max(0, nextTier.minSavings - savings),
    progressPercent,
  };
}
