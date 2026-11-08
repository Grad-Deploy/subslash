# CLAUDE.md

SubSlash — 구독의 1회 사용 단가를 보여주고 해지를 돕는 웹앱. Turborepo(pnpm) +
Next.js 16 App Router + Zustand(localStorage) + Drizzle/Turso.

## 이 저장소의 제1원칙: 모르는 것을 지어내지 않는다

앱이 보여주는 숫자와 링크는 사용자가 "해지할까"를 판단하는 근거다. 값이
없거나 확실하지 않으면 그럴듯한 기본값으로 채우지 말고, 모른다고 표시하고
채울 방법을 안내한다. 이 저장소에서 실제로 고친 사례들이다.

- 결제 월을 모르는 연간 구독에 D-30을 보여주던 것 → `null`을 반환하고 화면에
  "결제 월 미설정"을 띄운다
- 파싱에서 남은 토큰을 이름으로 쓰던 것 → 날짜·필드명은 후보에서 제외하고
  "알 수 없는 결제 (₩8,900)"로 둔다
- 홈페이지로 가는 링크를 "공식 해지 페이지"라고 부르던 것 → `cancelUrlKind`로
  성격을 기록하고 문구를 나눈다
- 시드 데이터로 가짜 연동 계정을 심어두던 것 → 계정 없이 시작한다
- 요금제가 여럿인 서비스(넷플릭스 등)에 한 요금을 기본값으로 채우던 것 → `plans`로 두고
  등록할 때 사용자가 고르게 한다. 가격 확인(`referencePriceFor`)은 고른 요금제와만
  비교하고, 요금제를 모르면 비교하지 않는다. 확인하지 못한 요금은 `defaultAmount: null`. 결제한 곳·약정마다
  요금이 달라 확인한 요금제만 적었으면 `plansIncomplete`를 둔다 — 요금제를 고르지 않고 금액만 적어도
  등록되고, 목록에 없는 요금으로 낸 사람이 맞지 않는 요금제를 기준으로 "요금이 달라요"를 듣지 않는다

새 코드에서 `|| 기본값`을 쓰기 전에, 그 기본값이 사용자에게 사실로 읽히는지
확인할 것.

## 기능별 설명서(docs/features)

이 파일에는 **규칙**(지키지 않으면 사고가 나는 것)을 두고, 기능이 어떻게 동작하는지의 설명은 아래 문서로 옮겼다. 해당 코드를 고치기 전에 읽는다.

- [subscription-signals.md](docs/features/subscription-signals.md) — 해지 기록, 행동 큐(`charged-after-kill`·`price-check`·`cancel-notice`), 결제 메일로 구독을 고치는 코드를 고칠 때.
- [account-sync.md](docs/features/account-sync.md) — `lib/account-sync`, `useAccountSync`, `lib/records-owner`, 로그인·로그아웃 때 기록이 바뀌는 코드를 고칠 때.
- [gmail-calendar-integrations.md](docs/features/gmail-calendar-integrations.md) — `lib/gmail-import`, `lib/gmail-auto-import`, Apps Script 웹 앱 코드, `/import`, 캘린더 등록, 용량 측정을 고칠 때.
- [social-login.md](docs/features/social-login.md) — `lib/oauth`, `lib/oauth-accounts`, `/api/auth/oauth/*`, 카카오톡 로그인을 고칠 때.
- [report.md](docs/features/report.md) — `/report`, 사용 시간 막대(`UsageTimeChart`)·체크인 막대(`CheckInUsageChart`), `orderEvidence`를 고칠 때.
- [ask-and-help-ai.md](docs/features/ask-and-help-ai.md) — `lib/ask`, `/api/ask`, `/api/help-ask`, `lib/help`, 평가·학습 세트, 모델·프롬프트를 바꿀 때.
- [phone-usage.md](docs/features/phone-usage.md) — `UsageStatsPlugin`, `lib/usage`, `lib/device-usage-client`, `/api/usage`, `/pc-usage`, `apps/usage-cli`를 고칠 때.
- [bundles.md](docs/features/bundles.md) — 서비스 목록의 `includes`, 결합 상품 구성·요금, `findBundleOverlaps`를 고칠 때.
- [receipts.md](docs/features/receipts.md) — `/report/receipt`, `lib/receipt-image*`, `lib/receipt-share`, 공유 링크를 고칠 때.
- [landing-and-onboarding.md](docs/features/landing-and-onboarding.md) — `components/home/Landing`, `components/launch/AppOnboarding`, `landing:screens` 캡처를 고칠 때.
- [app-build-and-native.md](docs/features/app-build-and-native.md) — `apps/mobile`, 안드로이드 릴리스 빌드(R8), `lib/mirrored-storage`, 로컬 알림, EAS 빌드를 고칠 때.

## 금액 계산

직접 `reduce`로 합산하지 말고 `@subslash/shared` 헬퍼를 쓴다.

| 상황                        | 함수                                 |
| --------------------------- | ------------------------------------ |
| 사용자에게 보이는 지출·절약 | `sumMyMonthlyKRW` / `sumMyAnnualKRW` |
| 카드에 청구되는 금액        | `sumMonthlyKRW` / `sumAnnualKRW`     |

해외 서비스 중 요금표에 세금이 빠진 곳은 `taxRate`(%)로 기록한다. `amount`는 요금표 가격이고,
한 번의 결제액(카드에 찍히는 값)을 보여줄 때는 `getBilledAmount`를 쓴다. 위 합산 헬퍼와 내 몫
계산은 세금을 이미 더한다. 가격 확인(`referencePriceFor`)은 요금표 가격끼리 비교하므로 `amount`
그대로다. 한국 결제 화면에서 세금이 따로 붙는 것을 확인한 서비스는 서비스 목록에 세율(`taxRate`)을
적고, 고르면 그 세율이 채워진 채 등록된다(사업자 결제처럼 붙지 않으면 사용자가 바꾼다). 확인하지
못한 서비스에는 세율을 적지 않는다.

공유 구독은 `sharingCount`·`myShareAmount`로 나뉜다. 4명이 나누는 구독을
해지해도 실제로 아끼는 돈은 4분의 1이므로, 지출·절약 수치는 전자를 쓴다.

USD 환산 환율은 상수가 아니라 사용자 설정값이다. USD 구독이 있으면 앱이 고시 환율(`/api/fx`, ECB, 영업일마다 한 번)로
저절로 맞추고(`useAutoExchangeRate`: 열 때·돌아올 때·켜 둔 동안 한 시간마다), 사용자가 직접 적은 환율(`manual`)은 바꾸지
않는다. 자동 환율의 값은 계정 동기화 지문(`recordsHash`)에 넣지 않는다 — 기기마다 날마다 바뀌어 다시 올리거나 충돌로 묻게 된다. 컴포넌트에서는
`useExchangeRate()`로 받아 넘긴다. 헬퍼의 기본 인자(`DEFAULT_EXCHANGE_RATE`)에
기대면 "내 환율을 쓴다"고 적힌 화면 옆에 1,350으로 계산한 값이 나온다.
구독 영수증·연말 결산처럼 **지난** 결제를 원화로 보여 줄 때는 지금 환율이 아니라 결제일의 고시 환율(ECB, `/api/fx/history` →
`useHistoricalRates` → `buildReceipt`·`buildYearInReview`·`getSavingsTiers`의 `rateOn`)로 바꾼다 — 지금 환율로 바꾸면 그때 낸 돈과 다른 숫자가 된다. 고시가 없는
주말·연휴는 그 전 고시일의 환율을 쓰고(`rateOnFromTable`), 그래도 모르거나 아직 오지 않은 결제는 사용자 환율로 바꾸며
그렇게 바꾼 건수를 영수증에 적는다(`receipt.fx`). 고시 환율도 카드사가 청구한 환율은 아니라고 적는다. 연말 결산의 지출 구성처럼
지금 구독을 앞으로 1년 낸다고 셈한 값은 지난 결제가 아니라 지금 환율이다.

사용자가 금액(통화·세율·나눠 내기 포함)을 고치면 스토어가 고치기 전·뒤를 `amountHistory`에 남긴다
(`utils/amountHistory`). 앱은 요금이 언제 바뀌었는지 모르므로 **고친 날부터** 새 금액이라고 보고, 영수증은 그 전의
결제를 고치기 전 금액으로 셈하며(`priceAsOf`) 그렇게 셈한 건수를 적는다(`receipt.priorAmount`) — 예전에는 요금을 올려
적으면 지난 달 영수증까지 새 금액으로 다시 계산됐다. 등록한 날 고친 것과 같은 날 여러 번 고친 것은 바로잡은 것으로
보아 남기지 않거나 하나로 합친다. 결제 기록(`chargeHistory`)과 섞지 않는다 — 그쪽은 결제 메일이라는 증거이고 이쪽은
사용자가 적은 값이다. 지킨 돈·연말 결산의 지출 구성은 지난 결제가 아니라 지금 금액 그대로다.

체크인은 "지난 30일 동안 몇 번"을 묻는다. 나누는 값은 한 달치 내 몫
(`getMyMonthlyShareAmount`)이어야 한다. 연 결제액을 그대로 나누면 12배가 된다.

## 결제일 계산

`getNextBillingDateFor` / `getDaysUntilBillingFor`를 쓴다. `billingDay`만 받는
`getNextBillingDate`는 월간 전용이라, 연간 구독에 쓰면 1년에 한 번인 결제를
매달 있는 것으로 계산한다(크론이 메일을 11번 더 보낸다).

두 함수는 결제 월이 없는 연간 구독에 `null`을 반환한다. 이때 화면은 숫자가
아니라 '미설정'을 보여주고, 크론은 건너뛰고, 정렬은 맨 뒤로 보낸다.

## 데이터 위치

기본 경험은 100% 로컬이다. 서버가 기록을 갖는 것은 사용자가 고른 기능(로그인·계정 저장·Gmail
자동 가져오기 등)을 쓸 때뿐이다. 서버에 행을 쓸 때는 바뀐 줄만 쓴다 — Turso는 저장 용량보다 행 쓰기
한도가 먼저 찬다.

결제 알림 메일과 캘린더 피드(webcal)는 2026년 10월에 그만뒀다 — 웹에서 결제일을 알리는 길은 '구글
캘린더에 결제일 등록', 앱은 기기 안의 로컬 알림이다. 남은 서버 기록(`notification_subscribers`·
`mirrored_subscriptions`·`notification_log`)은 `drizzle/0017_drop_retired_notify.sql`이 표째 지웠다(하루 크론
`/api/cron/notify`는 이름만 예전 그대로다). 다시 만들지 않는다 — 메일은
되돌리기 어려운 바깥 행동이고(보낸 메일은 회수할 수 없다), 이메일·구독 사본을 서버에 두는 유일한 이유였다.

샘플 체험(`startDemo`)은 실제 기록에 섞지 않는다. 체험 중 화면의 목록은 샘플이고 실제 기록은
`demo.saved`에 보관되며, localStorage에는 실제 기록만 저장한다(새로고침·30분·'체험 끝내기'로
끝남). 서버로 나가는 것(계정 저장·캘린더 등록)과 백업은 화면의 목록이 아니라 `realRecords`를 쓴다.
실제 기록을 넣는 동작(등록·불러오기·복원)은 체험을 먼저 끝낸다.

해지·결제 메일로 구독 상태를 알리는 규칙은 하나다: **증거(결제 메일)와 사용자의 기억·추측을 섞지 않는다.** 해지를 기록하는 곳은 어디서든 `killSubscription` 뒤에 `useCelebrateKill`을 부른다(화면마다 따로 만들면 한 곳에만 효과가 남는다). 해지한 구독에 결제 메일이 오면 `chargedAfterKillAt`, 청구액과 다른 금액이 보이면 `observedAmount`에 적고, 해지·취소 알림 메일은 해지로 **기록하지 않고** `cancelNoticeAt`으로 묻는다. 전문: [docs/features/subscription-signals.md](docs/features/subscription-signals.md). 해지 기록·행동 큐·결제 메일 처리를 고치기 전에 읽을 것.

무료 체험 중인 구독(`trialEndsAt`이 아직 오지 않음, `isInTrial`)은 카드에서 나가는 돈이 없다.
지출 합계·결제 캘린더·로컬 알림·캘린더 등록에서 모두 뺀다 — 넣으면 내지도 않은 돈을 '월
고정지출'로, 없는 결제를 달력에 보여주게 된다. 뺀 사실과 끝난 뒤 금액은 화면에 적는다. 행동 큐는
종료 7일 전부터 `trial-ending` 하나만 만들고 다른 줄은 만들지 않는다. 종료일을 모르면 체험 중으로
보지 않는다(모름을 체험으로 읽지 않는다).
체험 중에는 체크인하지 않는다 — 낸 돈이 없어 단가를 매길 수 없다. 체크인 창이 어느 길로 들어와도 안내만 보이고, 계속 낼지 정할 근거로 `trial-ending` 줄에 폰 기록을 보여 준다(`AppTrialUsageLine`).

내가 내지 않는 구독은 등록하지 않는다 — 등록·수정 폼은 결제 금액과 내 몫의 0원을 받지 않는다. 무료 체험은 끝난 뒤 낼 금액과 체험 종료일로 적는다. 복원·동기화 검사는 그대로 두므로(거절하면 백업을 통째로 복원하지 못한다) 예전 0원 기록은 남을 수 있고, 그 표시 처리(해지 권유 없음·'거의 안 씀')는 그 기록을 위한 것이다. 수정할 때 금액을 적게 된다.

로그인 세션 토큰은 웹에서는 httpOnly 쿠키에만 있다. 앱(Capacitor)은 화면이 다른 출처에서
돌아 쿠키가 실리지 않으므로 `Authorization: Bearer` 헤더로 보낸다(`readSessionToken`).
로그인·가입·재설정 응답 본문의 토큰은 앱 출처(`lib/app-origins`)에만 주고
(`sessionTokenForApp`), CORS도 앱 출처에만 연다(`proxy.ts`, Next.js 16의 middleware). 웹 요청에 본문 토큰을
주면 쿠키를 httpOnly로 둔 의미가 없어진다.

구독마다 가입한 계정(이메일·아이디)을 적는다(`linkedAccountName`, 등록 폼의 '가입한 계정' 칸). 해지 화면에서
'이 계정으로 로그인해야 해지 버튼이 보여요'로 쓴다. 예전에는 계정 목록을 따로 관리하는 '연동 계정 관리'
화면에서 골랐는데 칸 하나로 같은 일을 해 그 화면을 걷었다. 저장소의 `accounts` 칸과 `linkedAccountId`는
백업·계정 저장 형식이라 남긴다 — 지우면 예전 백업을 복원하지 못한다.

`/privacy`(개인정보처리방침)는 위 규칙을 사용자에게 적은 것이다. 서버에 저장하는 칸,
보관 기간, 삭제 경로, 쓰는 외부 서비스(Vercel·Turso·Resend)나 그 지역을 바꾸면 방침도 같은
PR에서 고친다. 방침은 한국어판(`components/privacy/PrivacyKo`, 원문)과 영어판(`PrivacyEn`) 두 벌이고 화면 언어로 고른다 —
둘을 함께 고치고(`privacy-translation.test`가 절·항목·조건 수를 견준다), 영어판에는 다르면 한국어판이 우선한다고 적는다. 보호책임자 연락처는 `lib/privacy.ts` 한 곳에만 있고, 정해지기 전에는 비워 둔다. 도움말(`/help`)의
문의 메일도 이 주소를 쓴다 — 주소를 따로 적지 않는다.

계정 동기화는 **병합하지 않는다.** 저장 시각(`savedAt`)을 판 번호로 쓰고 `If-Match`로 올려, 그사이 다른 기기가 올렸으면 서버가 409로 거절하고 양쪽이 따로 바뀌었으면 사용자에게 묻는다. 서버가 기기에 먼저 보내지 않고, 기기마다 다른 것(`accountSync`, 로컬 알림 설정)은 넣지 않는다. 화면의 기록은 주인(`recordsOwner`)별 칸이고 주인은 **서버가 답한 로그인 상태로만** 바꾼다 — 네트워크 오류를 로그아웃으로 읽지 않는다(그래서 `/api/auth/me`는 DB가 실패하면 503이다). 전문: [docs/features/account-sync.md](docs/features/account-sync.md). `lib/account-sync`·`lib/records-owner`를 고치기 전에 읽을 것.

**SubSlash는 Google 권한을 받지 않는다.** Gmail 가져오기·구글 캘린더 등록·용량 측정은 모두 사용자 계정으로 도는 Apps Script가 한다. Gmail 자동 가져오기는 "서버가 브라우저로 되쓰지 않는다"의 유일한 예외라 좁게 묶어 둔다 — 서버는 **구독 후보만** 남기고 메일 제목·본문을 표나 로그에 남기지 않는다. `GMAIL_AUTO_IMPORT_STARTS_ON`(`lib/privacy.ts`)을 정해야 열리고 방침에 항목이 먼저 게시된다. **배포 전에 두 배포 DB에 `drizzle/0016_gmail_charge_history.sql`을 적용한다.** 웹 앱 코드(`connect-web-app.ts` 등)를 고치면 운영자가 웹 앱을 다시 배포해야 반영된다. 전문: [docs/features/gmail-calendar-integrations.md](docs/features/gmail-calendar-integrations.md). Gmail·캘린더·용량 측정 코드를 고치기 전에 읽을 것.

## 구글·카카오·네이버로 로그인

구글·카카오·네이버 로그인은 `SOCIAL_LOGIN_STARTS_ON`(`lib/privacy.ts`)을 정해야 열리고, **열기 전에 두 배포 DB에 `drizzle/0014_social_login.sql`을 적용한다.** 받는 것은 이메일과 회원 번호(해시)뿐이고 제공자 토큰은 저장하지 않는다. 같은 이메일의 계정이 이미 있으면 **잇지 않고 거절한다**(`email-taken`) — 확인되지 않은 주소로 남의 계정에 들어가는 길이 되기 때문이다. 안드로이드 앱의 카카오톡 로그인은 서버가 토큰의 앱 ID(`KAKAO_APP_ID`)를 확인한 뒤에만 받는다. 전문: [docs/features/social-login.md](docs/features/social-login.md). 로그인·연결 코드를 고치기 전에 읽을 것.

## 요청 수 제한

로그인 없이 메일을 보내는 곳(가입, 비밀번호 재설정)과 비밀번호를 확인하는 곳(로그인, 비밀번호 변경,
회원 탈퇴)은 `lib/rate-limit`으로 횟수를 제한한다. 로그인은 실패만 세고(아이디·IP 기준), 계정을 잠그지
않고 잠시 기다리게 한다 — 잠그면 남이 일부러 틀려 주인을 못 들어오게 할 수 있다. 서버 인스턴스
메모리에 세므로 대량 공격을 완전히 막지는 못한다. 그건 Vercel 방화벽(WAF)의 속도 제한이 맡는다 — Hobby 요금제는 속도 제한 규칙이 하나뿐이라 인증·메일·AI 경로(POST)만 묶어 덮고, API 전체의 상한은 없다.
누를 때마다 행을 쓰는 곳(캘린더 등록)도 계정마다 센다 — Turso는 행 쓰기 한도가 먼저 찬다. 계정 기록·Gmail 받기·사용 기록·찾은 구독도 계정(또는 연결)마다 세고(`takeRateLimit`), 세션·연결 토큰은 발급한 모양(`isWellFormedToken`)이 아니면 DB를 읽지 않으며, 없는 토큰을 많이 내민 IP는 잠시 읽지 않는다 — 지어낸 토큰으로 Turso 읽기 한도를 태우지 못하게 하려는 것이다. 이때 세션 확인은 null이 아니라 오류로 끝난다(`SessionCheckThrottledError`): null은 로그아웃으로 읽혀 같은 IP의 로그인한 사람 기록이 바뀐다. 라우트는 이 오류를 429로 답하고 오류 줄을 남기지 않는다 — 처리하지 못한 오류는 `catch`에서 `serverErrorResponse`(`lib/route-error`)로 답한다(예전에는 500으로 답해, 지어낸 토큰으로 5xx 알림을 울릴 수 있었다). Google의 공유 IP에서 오는 요청(`/api/gmail/ingest`·`connect/exchange`·`calendar-sync/claim`)은 실패만 센다.
비밀값 비교(크론 `CRON_SECRET` 등)는 `timingSafeEqual`로 한다. 웹 응답의 보안 헤더(틀 넣기 금지 등)는
`next.config.ts`의 `headers()`에 있고, CSP는 `lib/csp`가 만든다. 페이지를 정적으로 두려고 nonce를 쓰지 않아
`script-src`에 'unsafe-inline'이 남는다 — 이 정책이 막는 것은 바깥 스크립트·바깥으로 보내기(`connect-src`)·`<base>`·
틀이다. 브라우저에서 바깥 주소를 부르게 바꾸면 그 출처를 `lib/csp`에 더한다(빠뜨리면 그 요청만 조용히 막힌다).

## 서버 로그와 외부 링크

서버 코드는 `console.error(scope, error)`로 오류 객체를 넘기지 않고 `logError`(`lib/log`)를 쓴다. Drizzle은
쿼리가 실패하면 메시지에 바인딩한 값을 싣는다(`params: 이메일,비밀번호 해시,...`) — 그대로 넘기면 DB 오류
한 번에 개인정보가 배포 로그에 남는다. UNIQUE 충돌도 `cause` 안에 있으므로 메시지가 아니라
`isUniqueViolation`으로 가린다.

외부 주소는 `openExternal`·`leaveForExternal`만 열고, 둘은 http(s)만 연다. 해지 주소는 입력·백업·계정 기록
여러 곳에서 들어와 `javascript:`·`intent:`가 섞일 수 있어서, 들어오는 곳이 아니라 여는 곳에서 막는다.
안드로이드는 세션 토큰이 든 Preferences(`CapacitorStorage.xml`)를 Google 클라우드 백업에서 뺀다
(`res/xml/data_extraction_rules.xml`) — Preferences에 새 비밀값을 두면 이 규칙이 함께 지킨다.

## 운영 알림

서버 오류 줄은 Grafana Cloud(Loki)에서 본다(`lib/error-export`, `logError`가 부른다). 나가는 것은 `[범위] 값을 지운 오류 문장`과 시각·배포 환경뿐이고 스택·계정·IP·요청 주소는 보내지 않는다. Vercel 요청 로그를 드레인으로 보내지 않는다 — 주소의 토큰과 IP가 함께 나간다. 값 지우기(`redactSecrets`)는 배포 로그에도 적용한다. 설정(`GRAFANA_LOKI_*`)과 방침 게시(`ERROR_LOG_EXPORT`)가 모두 있어야 나간다. 줄이 가는지는 `POST /api/ops/error-export-check`(`Authorization: Bearer <CRON_SECRET>`)로 확인한다 — `logError`로 `check-…` 한 줄을 남기고 그 id와 내보내기 상태(`active`)를 돌려준다. 쓰기 토큰은 배포에만 있어 밖에서 보내 볼 수 없다. 메일 링크의 토큰은 요청 로그에 남지 않게 `#` 뒤에 싣고 API에는 헤더(`X-Link-Token`)로 보낸다(`lib/link-token`) — 이미 보낸 메일의 `?token=`도 읽는다.

따로 관리자 화면을 두지 않는다 — 서버에 볼 기록이 거의 없고, 운영자가 계정 기록을 여는 것은 방침의 저장 목적에 없다.
오류는 Vercel 알림 규칙이 알린다(팀 기본 규칙 + `/api/*` 5xx·함수 사용량 이상을 medium부터 보는 규칙, `vercel alerts rules ls --all`).
Turso는 한도에 가까워져도 알리지 않고 넘으면 쿼리를 거절하므로, 하루 크론이 플랫폼 API로 사용량을 읽어 운영자에게
메일을 보낸다(`lib/turso-usage`, 환경 변수는 `.env.example`, 두 DB가 같은 조직이라 `subslash-web`에만 넣었다). 사용량은
`/usage`의 `organization.usage`, 한도는 구독 요금제의 `/plans` `quotas`다 — 문서의 응답 예시와 실제 모양이 달라 실제 응답으로
맞췄고, 모양이 다르면 0이나 '여유 있음'이 아니라 오류로 남긴다. 사용자 기록은 읽지도 보내지도 않는다.

## 구독 리포트와 익명 통계

리포트(`/report`)는 해지 전에도 볼 것이 있게 지금 내는 돈·1회 단가 순위를 둔다. 폰 기록이 없는 웹은 최근 체크인으로 구독별 사용량을 그린다. 멤버십 주문 근거(`orderEvidence`)는 혜택 금액 옆에 보이는 근거일 뿐 금액으로 바꾸지 않는다('주문 1건 = 배송비 3,000원'은 지어낸 숫자다). 전문: [docs/features/report.md](docs/features/report.md).

**익명 구독 통계는 2026년 10월 14일에 그만뒀다**(`ANONYMOUS_STATS_STARTS_ON`·`ANONYMOUS_STATS_ENDED_ON`은 방침의 '(종료)'
항목이 적는 기간으로만 남는다). 보여 주지 않는 통계를 모으지 않기로 해서 서버 코드(`/api/stats/*`, `lib/stats*`)와 기기 쪽
참여(`useStatsContribution`)를 걷었고, 남은 기기 토큰(`subslash-stats-sharing`)은 헤더가 열릴 때 지운다. 표
(`stats_contributors`·`stats_items`)는 `drizzle/0018_drop_anonymous_stats.sql`이 지운다 — **이 코드가 두 배포에 나간 뒤에**
두 DB에 적용한다(지우는 변경은 순서가 반대다, 아래 '작업 절차'). 다시 만들지 않는다. 체크인 최신값처럼 통계와 함께 쓰던
계산은 `lib/checkins`에 있다.

DB는 정보 종류별로 나누지 않는다. 같은 서버가 모든 접속 키를 쥐므로 나눠도 막아 주는 것이 거의 없고,
회원 탈퇴처럼 여러 표를 함께 지우는 일이 DB 사이에서는 한 번에 되지 않아 방침의 '곧바로 지운다'를
지키기 어려워진다. 대신 표끼리 묶지 않고(알림 ↔ 계정), 토큰은 해시로, 필요한 칸만 둔다.

## 리포트에 물어보기

리포트에 물어보기: **AI에는 질문 문장만 보낸다.** AI는 `lib/ask/tools.ts`의 도구와 인자만 고르고, 답과 숫자는 기기가 자기 기록으로 계산해 정해 둔 문장 틀에 넣는다 — 구독 목록·금액이 AI로 나가지 않고 AI가 숫자를 지어낼 자리가 없다. 질문은 표·로그에 남기지 않고, 열리는 조건은 `AI_ASK_STARTS_ON`과 서버 설정 둘 다이며 **열기 전에 방침에 처리 위탁(회사·항목·보관)을 게시한다.** 모델·프롬프트를 바꾸면 평가 세트(`pnpm --filter @subslash/web ask:eval`)로 비교하고 정답을 모델에 맞춰 고치지 않는다. Gemini API 약관은 18세 미만이 쓸 수 있는 서비스에서 쓰지 말라고 하고(SubSlash는 만 14세부터 가입) 무료 등급 입력은 제품 개선·사람 검토에 쓰이므로 모델을 고를 때 확인한다. 도움말 AI(`/api/help-ask`)는 공개된 FAQ 목록(`lib/help/faq`)에서 답이 되는 id만 고르고 **답 문장은 쓰지 않는다.** 전문: [docs/features/ask-and-help-ai.md](docs/features/ask-and-help-ai.md). `lib/ask`·`lib/help`를 고치기 전에 읽을 것.

## 도움말 AI

## 폰 사용 기록과 여러 기기 사용 측정

폰 사용 기록은 **기기 안에만** 쌓고 서버·백업·동기화에 넣지 않는다. 기록이 없는 날은 0이 아니라 **모른다.** 여러 기기 사용 측정은 로그인한 사용자가 설정에서 따로 켜고 켠 계정에 묶으며, `DEVICE_USAGE_STARTS_ON`을 정하기 전에 두 배포 DB에 `drizzle/0012_device_usage.sql`을 적용한다. PC의 AI 코딩 도구 사용(`/pc-usage`)도 서버로 보내지 않는다 — 결과는 화면과 `#` 뒤 링크로만 넘기고, 서버에 올리게 바꾸면 방침의 사전 게시가 먼저다. 전문: [docs/features/phone-usage.md](docs/features/phone-usage.md). 사용 기록·측정 코드를 고치기 전에 읽을 것.

## 파일 경계

화면에 보이는 결제 내역은 전부 사용자가 실제로 넘긴 것이다. 지어낸 영수증을 만드는
코드는 없다.

예시 영수증을 만들어 보여 주던 '메일함 스캔' 탭(`NEXT_PUBLIC_SHOW_INBOX_PREVIEW`)은 등록을 누르면 예시 데이터를 진짜
구독 목록에 써 넣어서 2026년 9월 19일에 플래그·픽스처·화면을 모두 지웠다. 다시 만들지 않는다.

Gmail 결제 메일 가져오기(`/import`)는 SubSlash가 Gmail에 연결하는 것이 아니다. 메일 내용은 `#` 뒤로만 넘어가 서버를 거치지 않으므로 이 값을 API로 보내거나 쿼리(`?`)로 옮기지 않는다. **결제가 일어났다는 증거**가 없는 메일은 후보로 만들지 않고, 본문에서만 찾은 서비스 이름은 사용자가 골라야 등록된다. 파싱 규칙 전문은 [docs/features/gmail-calendar-integrations.md](docs/features/gmail-calendar-integrations.md).

## 결합 상품

결합 상품(`includes`)의 구성·요금은 공식 발표나 판매 화면에서 **확인한 것만** 적고 `sourceUrl`에 출처를 남긴다. 같은 서비스를 따로 구독하면 등록할 때 묻고 리포트에 알린다. 전문: [docs/features/bundles.md](docs/features/bundles.md).

## 영수증 이미지 디자인

영수증 공유 링크(`/report/receipt/share#r=…`)는 내용을 `#` 뒤에만 싣고 서버에 두지 않으며 **서명하지 않는다**(사용자가 적은 기록을 인증된 것처럼 보이게 하지 않는다). 받는 화면과 그림 안에 '확인되지 않은 내용'이라고 적고, 받는 쪽은 칸마다 모양을 확인해 틀리면 그리지 않는다. 링크는 보낸 뒤 취소할 수 없어 기기에서 처음 보낼 때 묻는다. 전문: [docs/features/receipts.md](docs/features/receipts.md). 영수증 이미지·공유를 고치기 전에 읽을 것.

## 로고와 이모지

브랜드 마크는 `components/brand/Brand.tsx` 한 곳에 있다(마크·워드마크·락업). 좌표와 색은 브랜드
시트에서 뽑은 값이고, 앱 아이콘(`app/icon.svg`)도 같은 좌표를 쓴다 — 한쪽만 고치면 상단 바와 홈
화면 아이콘이 서로 다른 로고가 된다. 모바일 앱의 아이콘·스플래시(안드로이드 `res/`)는 `icon.svg`에서 만든 그림이다 — `icon.svg`를 고치면
`pnpm --filter @subslash/mobile assets`를 다시 돌린다(Capacitor 기본 그림이 남아 있어 앱만 다른 로고였다). 워드마크 가운데의 빨간 슬래시는 글꼴의 `/`가 아니라 기울인
막대이고, 읽는 기계에는 `Sub/Slash`로 들리도록 따로 적는다.

서비스 로고(`lib/service-logos.ts`)는 **확인한 것만** 적는다. 글리프를 눈대중으로 그리거나 브랜드
색을 지어내지 않고, 공식 앱 아이콘을 쓸 때는 어디서 받아 왔는지 `source`에 남긴다. 셋 다 없으면
이니셜 마크에 중립 회색이다. 리디처럼 브랜드 마크 자체가 글자인 곳이 있으니, 글자로 보인다고
폴백이라 단정하지 않는다.

화면에는 이모지를 쓰지 않는다. 버튼·제목·토스트 앞의 이모지는 글자가 이미 하는 말을 되풀이하면서
기기와 글꼴마다 다른 그림으로 나오고, 읽는 기계에는 이름이 그대로 읽힌다.
뜻이 있는 자리에는 이모지 대신 `lucide-react` 아이콘을 쓴다 — 기다리는 중은 `ui/spinner`, 빈
화면은 그 화면이 기다리는 것을 말하는 아이콘. 색·상태는 배지 색처럼 이미 쓰는 수단으로 말한다.
화살표(`→ ↑ ↓ ←`)는 방향을 가리키는 글자라 이모지가 아니다. 레벨·비유·소비 유형·공유 문구·캘린더
일정 제목에도 이모지를 두지 않는다. 서비스 목록에는 아이콘 이모지가
없고(`iconEmoji`를 지웠다), 목록의 서비스는 로고가 없으면 이니셜로 그린다 — 예전에 등록하며 구독에
복사된 이모지도 목록의 서비스면 쓰지 않는다(`ServiceLogo`). 사용자가 직접 등록하며 고른 아이콘
(`iconUrl`, 앱의 `CUSTOM_ICON_EMOJIS`)은 사용자 데이터라 그대로 보여 준다. E2E 선택자에 화면
문구를 쓸 때도 이모지를 넣지 않는다 — 문구에서 이모지를 빼면 선택자가 조용히 어긋난다.

## 설정 화면

켜고 끄고 연결하는 것(사용 측정·백업·전체 초기화·환율)은 설정 화면(`/settings`) 하나에 모은다.
화면 모드는 설정이 아니라 상단 바의 화면 모드 버튼(`ThemeMenu`, 웹·앱) 한 곳에서 자동·라이트·다크 중에
고른다 — 설정에 들어가지 않아도 바로 바꾸게. 해·달을 오가는 버튼으로 두지 않는다(그러면 '자동'으로 돌아갈 길이
없다). '자동'은 저장값을 지우는 것이라 첫 화면 스크립트(`themeInitScript`)가 그대로 시스템 설정을 따른다. 웹과 앱이 같은
`SettingsScreen`을 쓰고, 앱은 폰 사용 기록 칸을 더한다(`AppSettingsPage`). 구글 캘린더 등록은 설정이 아니라
'내 구독' 목록 아래에 둔다.
웹은 상단 바의 설정 아이콘(예전 결제 알림 종 자리, 좁은 화면은 계정 메뉴), 앱은 하단 설정 탭에서 연다.
다른 화면 아래에 설정 목록을 다시 늘어놓지 않는다 — 흩어져 있을 때 처음 쓰는 사람이 찾지 못했다.

도움말(`/help`, 자주 묻는 질문 + 문의 메일)은 계정 메뉴(웹·앱), 설정의 '정보'(웹·앱), 웹 하단 푸터에서 들어간다 —
설정 맨 아래와 푸터에만 있을 때는 찾아보지 않으면 지나쳤다. 문의는 웹에서는 Gmail 쓰기 화면과 주소 복사만
둔다 — 기본 메일 앱이 없거나 연결이 깨진 PC에서는 `mailto:`가 아무것도 열지 않았고, 페이지는 그 실패를 알 수 없다.
앱에서만 메일 앱(`mailto:`)을 맨 앞에 둔다(안드로이드에는 Gmail 앱이 기본으로 있어 쓰기 화면이 채워진 채 열린다). 답에는 코드가
실제로 하는 일만 적고, 기능을 바꾸면 그 답도 같은 PR에서 고친다. 닫혀 있는 기능(Gmail 자동 가져오기 등)의 질문은
그 기능이 열렸을 때만 보인다.

## 화면 언어(한국어·영어·중국어·일본어·베트남어·프랑스어·스페인어·독일어·포르투갈어)

화면 문구는 `lib/i18n/messages/<영역>.ts`에 한국어(`ko`, 원문)와 영어(`en`)를 나란히 두고 컴포넌트에서
`const t = useT()`로 쓴다. `en`의 타입은 `ko`의 모양에서 만들어(`Widen`) 영어가 빠지면 타입 검사가, 칸·인자 수가
어긋나거나 영어에 한글이 섞이면 `__tests__/unit/i18n.test.ts`가 잡는다. 개수가 들어가는 문구는 함수로 두고 영어는
단수·복수를 나눈다. 영역을 더하면 `messages/index.ts`의 두 언어에 함께 넣는다.

언어는 기기의 것이다(`lib/i18n/locale`, 키 `subslash-locale`) — 기기 언어를 따르고 설정의 '언어'에서 고르면 남긴다.
구독 기록 저장소·백업·계정 동기화에 넣지 않고, 주소에 싣지 않는다(앱은 화면을 정적으로 담아 경로를 늘릴 수 없다).
서버 렌더링·하이드레이션은 한국어로 그리고 그 뒤 기기 언어로 다시 그린다. `<html lang>`은 `localeInitScript`와
`LocaleEffects`가 맞춘다. 요금·원화는 한국 기준이라 옮기지 않는다 — 언어는 사는 나라가 아니라서(한국에 사는 일본어 사용자도 원화로 낸다) 언어로 통화를 바꾸거나 다른 나라 요금을 짐작해 채우지 않고, 원문 언어가 아닌 화면에서는 목록 요금 옆에 한국에서 확인한 값이라고 적는다(`KoreanPriceNote`: 서비스 고르기·추천·요금제·요금제 없는 서비스의 금액). 해외 요금을 넣는다면 언어가 아니라 나라 설정과 그 통화의 합계부터 만든다. 서비스 이름은 서비스 목록의 `nameEn`(브랜드의 영문 표기, 없으면
`nameKo`)으로 보이고, 등록한 구독은 이름이 목록의 이름(`nameKo`·`nameEn`·`name`) 중 하나 그대로면 화면 언어의 이름으로
보인다(`useServiceNames`, `lib/service-name`) — 영어 화면에서 등록한 'Netflix'는 한국어 화면에서 '넷플릭스'다(예전에는 영어 화면에서만
바꿔, 언어를 바꿔도 등록할 때의 언어로 남았다). 목록 이름과 다르게 고쳐 적은 이름('내 넷플릭스')은 그대로다 —
이름은 사용자 기록이라 저장된 값을 고치지 않고 보여 줄 때만 바꾼다. 영어 화면에서 고르면 영문 이름으로 저장되므로, 이름으로 같은 서비스인지
견줄 때는 `findPresetForSubscription`·`serviceNameKey`를 쓴다. `@subslash/shared`는 화면에 보일 문장을 만들지 않고
값을 돌려준다(예: 정산 문구는 `settlementParts` → `t.subs.card.settlementMessage`) — 한국어 문장을 돌려주는 shared 함수는
서버·테스트·한국 서비스에 보내는 글(환불 요청 `formatRefundRequest`)만 쓴다. 일부러 한국어로 두는 것: 서비스 목록의
해지 안내·요금 설명(확인한 원문 — 다른 언어 화면에서는 `SourceTextNote`로 '원문(한국어)'이라고 적고 `lang="ko"`를 단다), 환불 요청 글, 메일(`lib/email`), AI 프롬프트·도구 설명. 탭 제목은 `messages/pageTitles`
한 곳에 두고 페이지 metadata(한국어)와 `LocaleEffects`(화면 언어)가 함께 쓴다. 간편 로그인 회사 이름은
`t.auth.social.providers`로 보인다(서버의 `OAUTH_PROVIDER_LABEL`은 한국어).
입력 검사(`@subslash/shared`)와 서버 응답은 한국어 문장을 돌려준다 — 서버와 같은 함수라 언어마다 나누지 않고, 보여 주는
자리에서 `useKnownText()`(`lib/i18n/known-text`의 표)로 바꾼다. 표에 없는 문장은 원문을 보인다. 검사 함수나 서버 문구를 고치면
표도 고친다(`known-text.test.ts`가 갈래마다 확인한다). 화면을 연 뒤 비동기로 붙이는 문구는 `useLatestT()`로 읽는다 — 첫 화면은
한국어로 그린 뒤 다시 그리므로 effect가 잡아 둔 문구는 한국어일 수 있다.
Apps Script 웹 앱 화면(Gmail 연결·캘린더 등록·용량 측정)은 주소의 `lang=<언어>`로 화면 언어를 고르고(문구는 웹 앱 코드의 `TEXT`, 모르는 값은 한국어),
서버의 한국어 오류 문장 대신 웹 앱의 문구를 보인다 — 문구를 고치면 운영자가 웹 앱을 다시 배포해야 반영된다.
요금제 이름은 서비스 이름처럼 목록의 한국어 이름 그대로일 때만 영어 화면에서 바꾼다(`PLAN_NAMES_EN`, `useServiceNames().plan`).
E2E는 한국어 문구로 찾으므로 `playwright.config.ts`가 `locale: "ko-KR"`로 열고, 영어 화면은 `i18n.spec.ts`가 본다.

중국어(간체)·일본어·베트남어·프랑스어·스페인어·독일어·포르투갈어(브라질)도 정식 언어로 둔다. 서비스·요금제·앱 이름은 그 언어로 확인한 표기가 없으면 영문(`nameEn`·`PLAN_NAMES_EN`·`PACKAGE_LABELS_EN`)으로 보인다 — 현지 표기를 짐작해 적지 않는다. 영어 밖의 서버 문장 번역(`known-text-<언어>.ts`)은 영어 표의 정규식을 함께 쓰고 같은 순서의 번역 함수만 둔다(개수는 `known-text.test`가 본다). 달 이름은 `lib/i18n/months`.
언어를 더할 때는 `lib/i18n/config.ts`의 `LOCALES`·`LOCALE_INFO`에 넣는다. 원문(`SOURCE_LOCALE`, 한국어)이 아닌 언어마다 두는
번역 표는 `Translations<T>` 타입이라, 넣는 순간 채울 곳이 타입 오류로 나온다(문구 `messages`, FAQ `faq.ts`, 서버 문장
`known-text`, 결제 수단, 서비스·요금제 이름 `service-name`, 앱 이름 `usage/packages`). `locale === "en"`처럼 언어를 직접
견주지 않고 이 표나 `translationFor`·`intlLocale`을 쓴다. 표가 없어도 되는 것은 영어로 떨어진다: 지원하지 않는 기기 언어
(`FALLBACK_LOCALE`), 소개 캡처, 개인정보처리방침(번역판이 없으면 영어판 — 법률 문서를 확인 없이 옮기지 않는다. 그때는 맨 위에 영어판이라는 것과 한국어판이 우선한다는 것을 화면 언어로 한 줄 알린다, `privacyPage.englishOnly`), 탈퇴 확인
낱말(서버가 '탈퇴'·'DELETE'만 받는다). Apps Script 웹 앱·붙여 넣는 스크립트·캘린더 이름·일정 메모는 화면 언어 전부를
안다(`APPS_SCRIPT_LOCALES`) — 언어를 더하면 웹 앱 `TEXT`에 넣어 **웹 앱을 다시 배포한 뒤에** 이 목록에 넣는다. 서비스 이름은 서비스 목록에 그 언어의 칸을 확인해 더하고
`PRESET_NAMES`에 잇는다.

## 첫 화면(소개)

웹의 `/`는 무엇을 하는 서비스인지만 알리는 소개 페이지이고 등록 창을 다시 두지 않는다. 앱은 처음 실행할 때만 소개를 덮어 보여 주며, 소개를 크게 바꿀 때마다 키를 바꿔 예전 소개를 본 사용자도 한 번 본다. 전문: [docs/features/landing-and-onboarding.md](docs/features/landing-and-onboarding.md).

## 앱(Capacitor)에 담을 화면

모바일 앱은 이 웹 화면을 정적으로 내보내 앱 안에 담고, API만 배포된 Vercel을 부른다.
그래서 화면 코드는 다음을 지킨다.

- 서버 API는 `apiUrl("/api/...")`(`lib/api`)로 부른다. 앱 안의 상대 주소는 앱 자신을 가리킨다.
  로그인이 필요한 요청(`/api/auth`·`/api/account`·`/api/gmail`·`/api/calendar-sync`, 서버가
  `readSessionToken`으로 읽는 곳 전부)은 `apiFetch()`로 보낸다. 앱에는 쿠키가 실리지
  않아서, `apiFetch`가 기기에 둔 세션 토큰(`lib/session-token`)을 헤더로 싣고 로그인·가입·비밀번호
  변경 응답의 새 토큰을 받아 둔다. 그냥 `fetch`로 부르면 앱에서만 로그인하지 않은 것으로 읽힌다(Gmail
  자동 가져오기가 로그인한 앱에서 '로그인이 필요합니다'를 냈다). `apiFetch`는 요청마다 30초(`API_TIMEOUT_MS`)에서
  끊는다 — 브라우저 fetch는 스스로 끊지 않아 멈춘 모바일 네트워크에서 몇 분씩 로딩이 돌았다.
- 외부 사이트는 `openExternal()`, 공유는 `shareText()`(`lib/native`)로 연다. 앱에서는 인앱 브라우저와
  네이티브 공유 창이 된다. `window.open`·`navigator.share`를 직접 부르지 않는다.
- 복사는 `copyText()`, 파일 내려받기는 `saveFile()`(`lib/native`)로 한다. 앱의 웹뷰는 `<a download>`를
  처리하지 않고(백업 파일 저장이 앱에서 아무것도 만들지 않으면서 '저장'이라고 떴다), `navigator.clipboard`는
  출처·웹뷰에 따라 없거나 거절된다. 앱에서는 네이티브 클립보드와, 임시 폴더에 쓴 파일을 넘기는 공유 창이
  된다. 둘 다 성공 여부를 돌려주므로 실패했을 때 '복사됨'·'저장'을 띄우지 않는다. 네이티브 플러그인을
  더하면 `apps/web`과 `apps/mobile` 양쪽 의존성에 넣고 `npx cap sync`로 네이티브 프로젝트를 갱신한다.
- 외부 사이트에서 무언가를 마치고 **돌아와야 하는** 흐름(Google 권한 화면 등)은 `leaveForExternal()`을
  쓴다. 웹에서는 이 탭이 그대로 가고(돌아오면 화면이 다시 그려진다), 앱에서는 인앱 브라우저로 열고
  닫힐 때 `onReturn`으로 상태를 다시 읽는다. 앱에서 `window.location.assign`으로 나가면 앱 웹뷰가
  통째로 외부 사이트가 되어, 담아 둔 화면을 잃고 그 사이트의 '돌아가기'는 앱이 아니라 웹사이트를 연다.
  `onReturn`은 **그 화면 밖에서** 페이지를 새로 열 때만 받던 것까지 다시 받게 해야 한다 — 웹은
  돌아오면 모든 컴포넌트가 처음부터 돌지만 앱은 아니다. Gmail 연결은 링크 상태만 다시 읽어, 찾은
  구독(`GmailDiscoveryInbox`)이 앱을 껐다 켤 때까지 등록되지 않았다(`requestGmailDiscoveries`로 알린다).
  간편 로그인·로그인 방법 연결은 끝 화면(`/oauth/done`)이 앱의 돌아오는 주소(`<앱 ID>://oauth-done?결과`,
  `lib/app-return`, 매니페스트)를 연다 — 카카오톡으로 로그인하면 Chrome에서 끝나, 창을 닫으라는
  말만으로는 사용자가 웹에 남았다. `leaveForExternal`은 이 주소를 받으면 결과를 `onReturn`에 넘긴다. 앱의
  verifier는 기기에 10분 적어 두고(`lib/app-oauth`) 돌아오는 길·앱 복귀·다음 실행 어디서든 한 번만 받아 간다.
  인앱 브라우저가 여는 웹 화면에는 사이트 메뉴·Gmail 받기 상자를 두지 않는다(`SiteChrome`의 목록에 더한다).
  인앱 브라우저에 띄우는 외부 화면(Apps Script 웹 앱)도 웹사이트로 가는 링크를 두지 않는다 — 서버가
  앱 출처의 요청에 `client=app`을 붙이면 웹 앱은 웹사이트 대신 앱으로 돌아가는 길을 둔다. 링크를 두면
  인앱 브라우저에 웹이 열리고, 웹에 로그인돼 있으면 찾은 구독을 웹이 먼저 받아 가 앱에는 오지 않는다.
  Gmail 연결·캘린더 등록도 간편 로그인처럼 앱의 돌아오는 주소로 돌아온다: 앱이 API 주소에 `return=<앱 ID>`를
  붙이고(`withAppReturn`), 서버가 목록(`APP_RETURN_SCHEMES`)에 있는 것만 웹 앱에 넘기면, 웹 앱의 끝 화면이
  `<앱 ID>://oauth-done?flow=gmail|calendar`로 앱을 열어 본다. Apps Script 화면은 틀 안에서 돌아 사용자 동작 없는
  이동이 막힐 수 있으므로 'SubSlash 앱으로 돌아가기' 버튼을 함께 둔다. 스킴이 없으면(예전 앱) 예전처럼 창을
  닫으라고만 말한다. 웹 앱 코드를 고쳤으므로 운영자가 다시 배포해야 반영된다.
- 남에게 보낼 링크는 `webUrl()`로 만든다. 앱에서 `window.location.origin`은
  `https://localhost`(안드로이드)다.
- 페이지에 동적 경로(`[id]`)를 새로 만들지 않는다. 브라우저에서 만든 ID로는 페이지를 미리
  만들 수 없다. 구독 상세는 `subscriptionDetailHref()`(`/subs/detail?id=`)를 쓴다.
- 브라우저 기본 `confirm`·`prompt`·`alert`를 쓰지 않는다. 창 밖에서는 `ConfirmDialog`, 이미
  열린 창 안에서는 `InlineConfirm`을 쓴다(창을 겹치면 같은 Esc에 함께 닫힌다).
- 화면 위에 띄우는 것은 `ui/dialog`의 `Dialog`를 쓴다. 이 창은 포털로 `document.body`에 붙는다.
  그 자리에 그냥 그리면 조상이 만든 쌓임 맥락에 갇혀, 창의 `z-50`이 그 안에서만 통한다 —
  `/subs`의 상세 칸(`xl:sticky`)에서 연 창을 헤더(`z-40`)가 덮어 제목과 닫기 버튼이 가려졌다.
  `position: sticky`는 z-index를 주지 않아도 **늘** 쌓임 맥락을 만든다. `fixed`와 큰 `z-`만으로는
  모자라니, 덮개를 새로 만들지 말고 이 `Dialog`에 얹는다.
- 페이지를 통째로 다시 부르는 이동(`window.location.href =`, `location.reload()`, next/link가
  아닌 `<a href="/...">`)을 쓰지 않는다. 앱은 확장자 없는 주소(`/dashboard`)를 모두 `index.html`로
  열어서, 다시 부른 페이지는 홈 화면이 된다. 화면 이동은 next/link와 `useRouter`로만 한다.
- 페이지·레이아웃 파일은 `.tsx`로 만든다. 앱 빌드는 `.tsx`만 경로로 읽어 `route.ts`·`proxy.ts`를
  뺀다(`next.config.ts`).

앱 화면은 `pnpm --filter @subslash/web build:app`으로 만들고(`NEXT_PUBLIC_WEB_ORIGIN`이 꼭 있어야 한다) `apps/mobile`이 안드로이드만 담는다. 앱에서만 달라지는 동작은 `IS_APP_BUILD`로 가른다. R8 난독화, 구독 기록 사본(`lib/mirrored-storage`), 로컬 알림, EAS 빌드의 주의점은 [docs/features/app-build-and-native.md](docs/features/app-build-and-native.md)에 있다 — 네이티브 코드·릴리스 빌드·EAS를 고치기 전에 읽을 것.

## 작업 절차

```bash
pnpm turbo lint typecheck
pnpm test
pnpm build
```

- 스키마를 바꿨으면 `cd apps/web && pnpm db:generate` (오프라인 동작). 통합
  테스트는 `drizzle/` 안의 마이그레이션을 순서대로 전부 적용하므로 새 파일이
  자동으로 검증된다.
- 테이블·컬럼 이름 변경은 `db:generate`/`db:push`가 "새로 만들지, 이름을 바꿀지"를
  대화형으로 묻는다. 마이그레이션 SQL과 스냅샷을 직접 쓰고, 생성 뒤
  `pnpm db:generate`가 "No schema changes"를 내는지로 스냅샷을 확인한다. 배포 DB에는
  push가 아니라 그 SQL로 적용한다 — push에서 '만들기'를 고르면 기존 테이블이 지워진다.
- 배포 DB에 SQL을 적용할 때는 `pnpm --filter @subslash/web db:apply`(`scripts/db-migrate/apply.ts`)를 쓴다.
  인자 없이 돌리면 적용 여부만 보여 주고, `-- --apply 0012`처럼 번호를 줘야 한 트랜잭션으로 적용한다.
  이미 적용됐거나 일부만 있거나 앞선 테이블이 없으면 적용하지 않는다. 새 마이그레이션을 만들면 이
  스크립트의 `MIGRATIONS`에 확인 방법을 더한다. 먼저 `file:` 사본으로 시험해 볼 수 있다.
- 배포 DB는 두 개이고 데이터를 섞지 않는다. `subslash`는 leesean2/subslash(Vercel
  `subslash-web-qki1`), `subslash-grad`는 Grad-Deploy/subslash 미러(Vercel `subslash-web`)가
  쓴다. 검색에는 공개 웹만 노출한다 — `subslash-web-qki1`에는 환경 변수 `SEARCH_INDEXING=off`를 둬 모든 화면을
  noindex로 둔다(`lib/site-metadata`). 미러가 병합 즉시 새 레포로 옮겨 곧바로 배포되므로, 스키마를 바꾸는 PR은 병합
  전에 **두 DB 모두** 마이그레이션 SQL을 적용한다. 한쪽만 적용하면 다른 쪽 배포에서 새
  테이블을 쓰는 화면이 500을 낸다. **지우는 변경은 순서가 반대다** — 먼저 그 칼럼·표를 읽고 쓰지 않는 코드를
  병합해 두 배포에 나간 뒤에 DROP을 적용한다. Drizzle은 스키마의 칼럼을 모두 조회하므로, DROP을 먼저 적용하면
  배포 중인 옛 코드가 `no such column`으로 실패한다(2026년 10월 14일 `accounts.age`·`gender`를 먼저 지워 로그인·가입이
  500을 냈다). DROP은 되돌릴 수 없으니 적용 전에 값이 든 행 수를 확인한다.
- 앱(`apps/mobile/eas.json`의 `NEXT_PUBLIC_WEB_ORIGIN`)은 공개 웹 `www.subslash.me`(`subslash-grad`)를
  부른다. 웹과 다른 배포를 부르게 하면 DB가 달라져, 웹 계정으로 앱에 로그인할 수 없다.
- E2E는 CI와 같게 `--workers=1`로 돌린다. 기본 병렬로는 샘플 데이터 테스트가
  30초 테스트 타임아웃에 걸리는 기존 flake가 있다.
- Claude Code 훅(`.claude/settings.json`, 스크립트는 `scripts/claude-hooks/`)이 붙어 있다. 파일을
  고치면 그 파일에 prettier·eslint를 돌리고(`post-edit.mjs`), 작업을 마칠 때 커밋하지 않은 TypeScript
  변경이 있으면 타입 검사와 `vitest related`를 돌린다(`on-stop.mjs`). 실패하면 exit 2로 돌려보내 고치게
  한다. 저장소 경로에 공백('바탕 화면')이 있어 셸로 넘기는 경로는 상대 경로로 쓴다.
- PR마다 Claude가 리뷰 댓글을 남긴다(`.github/workflows/claude-review.yml`). 병합을 막지 않는 피드백이고,
  저장소 시크릿 `ANTHROPIC_API_KEY`(또는 `CLAUDE_CODE_OAUTH_TOKEN`)가 없으면 건너뛴다. 미러 저장소와
  포크 PR에서는 돌지 않는다.
- 커밋 메시지는 한국어로, "무엇을 왜"를 쓴다. 무엇이 잘못돼 있었고 사용자에게
  어떻게 보였는지가 핵심이다.
