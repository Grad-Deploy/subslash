import { summarize, type ContributorRow, type StatsItem, type StatsSummary } from "./stats";

/**
 * 비공개 테스트 빌드에서 '다른 사용자와 비교'가 어떻게 보이는지 확인하려고 만든 **가상 참여자 40명**.
 * 실제 사람이 아니다. 자주 쓰는 구독을 조합해 지어낸 사례이고, 금액은 서비스 목록의 요금표(공유하면
 * 내 몫, USD는 1,350원 기준)에서 잡았다.
 *
 * `NEXT_PUBLIC_STATS_SAMPLE=1`로 만든 빌드에서만 켜진다(eas.json의 `closed-test`). 켜지면 서버 통계
 * 대신 이 요약을 보여 주고, 화면에 '가상 데이터'라고 적는다 — 지어낸 숫자를 '보통'이라고만 부르면
 * 사실로 읽힌다. 서버 DB에는 넣지 않는다. 넣으면 실제 참여자의 비교에 섞인다.
 */
export const STATS_SAMPLE_ENABLED = process.env.NEXT_PUBLIC_STATS_SAMPLE === "1";

type Item = [presetId: string, monthlyKRW: number, usageCount: number | null];

/** 목록 밖 구독(직접 적은 것)은 이름을 보내지 않으므로 합계·개수에만 들어간다. */
function persona(items: Item[], extraKRW = 0, extraCount = 0): ContributorRow {
  const statsItems: StatsItem[] = items.map(([presetId, monthlyKRW, usageCount]) => ({
    presetId,
    monthlyKRW,
    usageCount,
  }));
  const sum = statsItems.reduce((total, item) => total + item.monthlyKRW, 0) + extraKRW;
  return {
    totalMonthlyKRW: Math.round(sum / 1000) * 1000,
    activeCount: statsItems.length + extraCount,
    items: statsItems,
  };
}

export const SAMPLE_CONTRIBUTORS: ContributorRow[] = [
  // 1-10: OTT 여러 개를 겹쳐 보는 사람들
  persona([
    ["netflix", 13500, 12],
    ["tving", 9500, 4],
    ["coupang-wow", 7900, 9],
    ["youtube-premium", 14900, 30],
  ]),
  persona([
    ["netflix", 4300, 8],
    ["disney-plus", 9900, 1],
    ["wavve", 7900, 2],
    ["youtube-premium", 14900, 25],
  ]),
  persona([
    ["netflix", 17000, 20],
    ["tving", 13500, 10],
    ["disney-plus", 13900, 3],
    ["watcha", 7900, 0],
  ]),
  persona([
    ["netflix", 7000, 6],
    ["coupang-wow", 7900, 15],
    ["naver-plus", 4900, 7],
  ]),
  persona(
    [
      ["netflix", 13500, 3],
      ["tving", 5500, 6],
      ["wavve", 10900, 1],
      ["laftel", 9900, 5],
    ],
    3900,
    1,
  ),
  persona([
    ["netflix", 4500, 14],
    ["youtube-premium", 14900, 28],
    ["spotify", 11990, 22],
  ]),
  persona([
    ["tving", 9500, 11],
    ["coupang-wow", 7900, 12],
    ["baemin-club", 4000, 6],
    ["naver-plus", 4900, 3],
  ]),
  persona([
    ["netflix", 13500, 9],
    ["disney-plus", 9900, 0],
    ["apple-tv", 8900, 1],
    ["youtube-premium", 14900, 18],
  ]),
  persona(
    [
      ["netflix", 17000, 25],
      ["wavve", 13900, 7],
      ["tving", 13500, 5],
    ],
    12000,
    1,
  ),
  persona([
    ["netflix", 3400, 5],
    ["tving", 3400, 2],
    ["youtube-premium", 8500, 20],
  ]),

  // 11-20: 음악·쇼핑 멤버십 위주
  persona([
    ["youtube-premium", 14900, 30],
    ["coupang-wow", 7900, 18],
    ["baemin-club", 4000, 10],
  ]),
  persona([
    ["melon", 11990, 26],
    ["coupang-wow", 7900, 8],
    ["naver-plus", 4900, 5],
  ]),
  persona([
    ["spotify", 11990, 30],
    ["netflix", 13500, 7],
    ["apple-icloud", 4400, null],
  ]),
  persona([
    ["melon", 8690, 20],
    ["youtube-premium", 14900, 12],
    ["naver-webtoon", 4900, 15],
  ]),
  persona([
    ["spotify", 6600, 24],
    ["youtube-premium", 8500, 22],
    ["baemin-club", 4000, 3],
  ]),
  persona([
    ["coupang-wow", 7900, 20],
    ["naver-plus", 4900, 11],
    ["baemin-club", 4000, 14],
    ["netflix", 7000, 4],
  ]),
  persona([
    ["apple-music", 8900, 28],
    ["apple-icloud", 4400, null],
    ["netflix", 13500, 10],
  ]),
  persona(
    [
      ["melon", 7590, 18],
      ["tving", 9500, 3],
      ["coupang-wow", 7900, 6],
    ],
    2200,
    1,
  ),
  persona([
    ["naver-vibe", 8500, 16],
    ["naver-plus", 4900, 9],
    ["naver-mybox", 3000, null],
  ]),
  persona([
    ["youtube-premium", 14900, 30],
    ["spotify", 11990, 1],
    ["melon", 11990, 25],
  ]),

  // 21-30: AI·업무 도구를 쓰는 사람들
  persona([
    ["chatgpt-plus", 27000, 40],
    ["notion", 16800, 20],
    ["youtube-premium", 14900, 25],
  ]),
  persona([
    ["chatgpt-plus", 27000, 12],
    ["claude-pro", 29700, 30],
    ["github-copilot-pro", 13500, 22],
  ]),
  persona([
    ["chatgpt-plus", 27000, 3],
    ["netflix", 13500, 8],
    ["coupang-wow", 7900, 10],
  ]),
  persona([
    ["claude-pro", 29700, 18],
    ["cursor-pro", 27000, 25],
    ["google-one", 2400, null],
  ]),
  persona([
    ["chatgpt-plus", 27000, 28],
    ["google-ai-pro", 29000, 2],
    ["notion", 16800, 6],
  ]),
  persona([
    ["chatgpt-plus", 27000, 15],
    ["perplexity-pro", 27000, 4],
    ["youtube-premium", 14900, 20],
  ]),
  persona([
    ["microsoft-365", 12500, 10],
    ["chatgpt-plus", 27000, 9],
    ["adobe-cc", 37000, 8],
  ]),
  persona([
    ["chatgpt-plus", 27000, 35],
    ["claude-pro", 29700, 10],
    ["netflix", 13500, 4],
    ["spotify", 11990, 20],
  ]),
  persona([
    ["notion", 16800, 0],
    ["chatgpt-plus", 27000, 6],
    ["google-one", 11900, null],
  ]),
  persona([
    ["claude-pro", 29700, 22],
    ["chatgpt-plus", 27000, 2],
    ["github-copilot-pro", 13500, 18],
  ]),

  // 31-40: 저장공간·독서·적게 쓰는 사람까지 섞은 경우
  persona([
    ["apple-icloud", 1100, null],
    ["google-one", 2400, null],
    ["millie", 9900, 6],
  ]),
  persona([
    ["ridi-select", 4900, 10],
    ["millie", 9900, 2],
    ["netflix", 13500, 12],
  ]),
  persona([
    ["coupang-wow", 7900, 3],
    ["baemin-club", 4000, 1],
  ]),
  persona([
    ["netflix", 17000, 2],
    ["disney-plus", 13900, 0],
    ["tving", 13500, 1],
    ["wavve", 13900, 0],
  ]),
  persona([
    ["youtube-premium", 14900, 30],
    ["apple-icloud", 14000, null],
    ["apple-music", 8900, 10],
  ]),
  persona([
    ["baemin-club", 4000, 8],
    ["coupang-wow", 7900, 11],
    ["naver-plus", 4900, 2],
    ["tving", 5500, 4],
  ]),
  persona(
    [
      ["spotify", 8690, 12],
      ["netflix", 7000, 3],
      ["kakao-emoticon", 3900, 20],
    ],
    5000,
    2,
  ),
  persona([
    ["google-one", 2400, null],
    ["youtube-premium", 14900, 15],
    ["chatgpt-plus", 27000, 20],
  ]),
  persona([
    ["coupang-wow", 7900, 25],
    ["youtube-premium", 14900, 30],
    ["netflix", 13500, 15],
    ["chatgpt-plus", 27000, 30],
    ["tving", 9500, 7],
  ]),
  persona([
    ["naver-plus", 4900, 1],
    ["baemin-club", 4000, 5],
    ["melon", 8690, 14],
    ["apple-icloud", 4400, null],
  ]),
];

let cached: StatsSummary | null = null;

/** 가상 참여자로 만든 요약. 실제 통계와 같은 `summarize`를 거쳐 문턱도 똑같이 적용된다. */
export function sampleStatsSummary(): StatsSummary {
  cached ??= summarize(SAMPLE_CONTRIBUTORS);
  return cached;
}
