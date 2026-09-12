/**
 * USD → KRW 환산에 쓰는 사용자 설정.
 *
 * 브라우저 저장소(`store.ts`)와 백업 검증(`backup.ts`)이 함께 쓴다. 저장소 모듈은
 * zustand 스토어를 만들어서 서버 코드가 가져다 쓰기 어렵다. 계정에 저장한 기록을
 * 서버가 다시 검증할 수 있도록, 설정의 모양과 검증만 여기로 떼어 둔다.
 */

/** Where the USD → KRW rate in use came from. */
export type ExchangeRateSource = "default" | "manual" | "ecb";

/**
 * The rate every USD subscription is converted with.
 *
 * A single hardcoded constant put every won total slightly off whenever the
 * market moved, with nothing on screen to say so. The rate is now part of the
 * user's data: they can type the one their card statement implies, or pull the
 * latest published reference rate, and the app shows which one it used.
 */
export interface ExchangeRateSetting {
  /** Null while nobody has chosen one; reads fall back to DEFAULT_EXCHANGE_RATE. */
  rate: number | null;
  source: ExchangeRateSource;
  /** ISO timestamp of when this rate was set or published. */
  updatedAt: string | null;
}

export const DEFAULT_EXCHANGE_RATE_SETTING: ExchangeRateSetting = {
  rate: null,
  source: "default",
  updatedAt: null,
};

/** Rejects rates that would silently corrupt every total. */
export function isValidExchangeRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0 && rate <= 100000;
}
