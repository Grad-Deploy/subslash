import { findPresetForSubscription, type Subscription } from "@subslash/shared";

/**
 * 서비스(서비스 목록의 id) → 그 서비스를 쓰는 안드로이드 앱 패키지.
 *
 * Play 스토어 주소(play.google.com/store/apps/details?id=…)로 앱 이름과 개발사를 확인한 것만
 * 적는다(2026-09-25 확인). 추측으로 채우지 않는다 — 틀린 패키지는 늘 0회로 읽혀 '안 쓰는 구독'으로
 * 잘못 알린다.
 *
 * 일부러 넣지 않은 것:
 * - 멤버십(쿠팡 와우·네이버플러스·배민클럽): 혜택을 쓴 것과 앱을 연 것이 다르다. 쿠팡플레이 앱만
 *   세면 배송 혜택으로 쓰는 사람이 늘 0회가 된다.
 * - 저장 공간(아이클라우드·구글 원·네이버 MYBOX): 앱을 열지 않아도 사진이 올라가며 제 일을 한다.
 * - 다른 앱 안에서 쓰는 것(카카오 이모티콘)과 자동충전(네이버 웹툰 쿠키 — 무료 회차만 봐도 앱을 연다).
 * - PC에서 쓰는 도구(Cursor·GitHub Copilot)와 앱이 여럿인 묶음(어도비·마이크로소프트 365).
 *
 * 여기에 패키지를 더하면 apps/mobile/android/app/src/main/AndroidManifest.xml의 <queries>에도 더한다
 * (안드로이드 11부터 매니페스트에 적지 않은 앱은 설치 여부를 알 수 없다). 테스트가 둘을 맞춰 본다.
 */
export const USAGE_PACKAGES: Readonly<Record<string, readonly string[]>> = {
  netflix: ["com.netflix.mediaclient"],
  tving: ["net.cj.cjhv.gs.tving"],
  wavve: ["kr.co.captv.pooqV2"],
  watcha: ["com.frograms.wplay"],
  // 프리미엄 혜택은 유튜브와 유튜브 뮤직 모두에 걸린다.
  "youtube-premium": ["com.google.android.youtube", "com.google.android.apps.youtube.music"],
  "disney-plus": ["com.disney.disneyplus"],
  "apple-tv": ["com.apple.atve.androidtv.appletv"],
  "prime-video": ["com.amazon.avod.thirdpartyclient"],
  laftel: ["laftel.net.laftel"],
  spotify: ["com.spotify.music"],
  melon: ["com.iloen.melon"],
  "apple-music": ["com.apple.android.music"],
  "naver-vibe": ["com.naver.vibe"],
  "google-ai-pro": ["com.google.android.apps.bard"],
  notion: ["notion.id"],
  "chatgpt-plus": ["com.openai.chatgpt"],
  "claude-pro": ["com.anthropic.claude"],
  "perplexity-pro": ["ai.perplexity.app.android"],
  millie: ["kr.co.millie.millieshelf"],
  "ridi-select": ["com.initialcoms.ridi"],
};

/** 연결표의 모든 패키지. 기기는 구독 여부와 관계없이 이 목록을 모두 쌓는다 — 나중에 등록한 구독도 지난 기록을 본다. */
export const ALL_USAGE_PACKAGES: readonly string[] = [
  ...new Set(Object.values(USAGE_PACKAGES).flat()),
];

/** 이 구독을 폰 기록으로 잴 수 있으면 그 앱 패키지들, 아니면 null(직접 체크인). */
export function packagesFor(sub: Subscription): readonly string[] | null {
  const preset = findPresetForSubscription(sub);
  return (preset && USAGE_PACKAGES[preset.id]) ?? null;
}
