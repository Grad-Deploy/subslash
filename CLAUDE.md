# CLAUDE.md

SubSlash — 구독의 1회 사용 단가를 보여주고 해지를 돕는 웹앱. Turborepo(pnpm) +
Next.js 15 App Router + Zustand(localStorage) + Drizzle/Turso.

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
  비교하고, 요금제를 모르면 비교하지 않는다. 확인하지 못한 요금은 `defaultAmount: null`

새 코드에서 `|| 기본값`을 쓰기 전에, 그 기본값이 사용자에게 사실로 읽히는지
확인할 것.

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

USD 환산 환율은 상수가 아니라 사용자 설정값이다. 컴포넌트에서는
`useExchangeRate()`로 받아 넘긴다. 헬퍼의 기본 인자(`DEFAULT_EXCHANGE_RATE`)에
기대면 "내 환율을 쓴다"고 적힌 화면 옆에 1,350으로 계산한 값이 나온다.

체크인은 "지난 30일 동안 몇 번"을 묻는다. 나누는 값은 한 달치 내 몫
(`getMyMonthlyShareAmount`)이어야 한다. 연 결제액을 그대로 나누면 12배가 된다.

## 결제일 계산

`getNextBillingDateFor` / `getDaysUntilBillingFor`를 쓴다. `billingDay`만 받는
`getNextBillingDate`는 월간 전용이라, 연간 구독에 쓰면 1년에 한 번인 결제를
매달 있는 것으로 계산한다(크론이 메일을 11번 더 보낸다).

두 함수는 결제 월이 없는 연간 구독에 `null`을 반환한다. 이때 화면은 숫자가
아니라 '미설정'을 보여주고, 크론은 건너뛰고, 정렬은 맨 뒤로 보낸다.

## 데이터 위치

기본 경험은 100% 로컬이다. 서버는 **알림을 켠 사용자에 한해**, 알림에 필요한
최소 정보만 미러로 갖는다. 동기화는 단방향 전체 교체이므로 병합·충돌 처리가
없고, 서버는 절대 클라이언트로 되쓰지 않는다.

샘플 체험(`startDemo`)은 실제 기록에 섞지 않는다. 체험 중 화면의 목록은 샘플이고 실제 기록은
`demo.saved`에 보관되며, localStorage에는 실제 기록만 저장한다(새로고침·30분·'체험 끝내기'로
끝남). 서버로 나가는 것(알림 미러·계정 저장)과 백업은 화면의 목록이 아니라 `realRecords`를 쓴다.
실제 기록을 넣는 동작(등록·불러오기·복원)은 체험을 먼저 끝낸다.

토큰은 용도별로 분리한다. sync 토큰은 Authorization 헤더 전용이고 URL에 넣지
않는다. 캘린더 피드는 URL 자체가 자격증명이므로 읽기 전용 토큰을 따로 쓴다.

해지한 구독에 결제 메일이 오면 그 사실을 구독에 적는다(`chargedAfterKillAt`). 행동 큐의
`charged-after-kill`은 큐에서 유일하게 **증거가 있는** 줄이라 맨 앞이다 — 나머지는 "아까울 수
있다"이고 이것만 "이미 잘못됐다"이다. 사용자의 기억(`killVerifiedAt`)과 섞지 않는다. 다시
확인해 주거나 구독을 되살리면 지운다.

결제 메일의 금액이 등록된 청구액과 다르면 그 사실을 적는다(`observedAmount`). 요금표를 조회하지
않으므로 "요금이 올랐다"고 단정하지 않고 두 숫자를 나란히 보여준다 — `lastPriceCheckedAt`(오래돼서
확인해 달라는 추측)과 달리 이것은 관측이라, 행동 큐에서도 `price-check`보다 앞이다. 비교는 요금표
가격이 아니라 `getBilledAmount`와 하고(영수증은 청구액이다), 결제 주기가 다르면 비교하지 않는다.
요금을 확인해 주거나 금액을 고치면 지운다.

무료 체험 중인 구독(`trialEndsAt`이 아직 오지 않음, `isInTrial`)은 카드에서 나가는 돈이 없다.
지출 합계·결제 캘린더·알림 미러·캘린더 등록에서 모두 뺀다 — 넣으면 내지도 않은 돈을 '월
고정지출'로, 없는 결제를 달력에 보여주게 된다. 뺀 사실과 끝난 뒤 금액은 화면에 적는다. 행동 큐는
종료 7일 전부터 `trial-ending` 하나만 만들고 다른 줄은 만들지 않는다. 종료일을 모르면 체험 중으로
보지 않는다(모름을 체험으로 읽지 않는다).

로그인 세션 토큰은 웹에서는 httpOnly 쿠키에만 있다. 앱(Capacitor)은 화면이 다른 출처에서
돌아 쿠키가 실리지 않으므로 `Authorization: Bearer` 헤더로 보낸다(`readSessionToken`).
로그인·가입·재설정 응답 본문의 토큰은 앱 출처(`lib/app-origins`)에만 주고
(`sessionTokenForApp`), CORS도 앱 출처에만 연다(`proxy.ts`, Next.js 16의 middleware). 웹 요청에 본문 토큰을
주면 쿠키를 httpOnly로 둔 의미가 없어진다.

서버 테이블은 두 갈래이고 합치지 않는다. `notification_subscribers`(와
`mirrored_subscriptions`, `notification_log`)는 "알림을 켠 브라우저"라 로그인
없이도 생기고, `accounts`(와 `sessions`, `account_snapshots`)는 선택 로그인 계정이다.
합치면 알림에 로그인이 필요해진다. 앞쪽의 예전 이름이 `users`여서 로그인 계정 테이블로
오해를 샀다(0006에서 바꿈).

화면에서는 결제 알림과 연동 계정을 로그인한 사람에게만 보여준다. 이것은 화면 규칙일
뿐이다 — `/api/notify/*`에 로그인을 요구하지 않고, 알림 테이블도 계정과 묶지 않는다.
로그인 없이 이미 알림을 켰거나 확인 메일을 기다리는 브라우저에는 알림 설정을 계속
보여준다(숨기면 끌 곳이 사라진다). 이미 저장된 연동 계정은 로그아웃해도 지우지 않고
상세 화면에 그대로 보인다.

`/privacy`(개인정보처리방침)는 위 규칙을 사용자에게 적은 것이다. 서버에 저장하는 칸,
보관 기간, 삭제 경로, 쓰는 외부 서비스(Vercel·Turso·Resend)나 그 지역을 바꾸면 방침도 같은
PR에서 고친다. 보호책임자 연락처는 `lib/privacy.ts` 한 곳에만 있고, 정해지기 전에는 비워 둔다.

`account_snapshots`는 로그인한 계정의 기록 한 벌(백업 파일과 같은 형식)이다. 로그인한 기기는
자동 동기화로 이 표와 기록을 맞춘다(`lib/account-sync`가 판단, `hooks/useAccountSync`가 실행) — 기록이
바뀌면 올리고, 다른 기기가 올린 것은 화면으로 돌아올 때 받아 온다. 기기마다 끌 수 있고, 끈 기기는
'계정에 저장'·'계정에서 불러오기'를 눌러야 옮긴다. 규칙은 이렇다.

- 병합하지 않는다. 저장 시각(`savedAt`)을 판 번호로 쓰고, 올릴 때 마지막으로 본 판을
  `If-Match`로(처음이면 `If-None-Match: *`) 건다. 그사이 다른 기기가 올렸으면 서버가 409로
  거절한다. 서버만 바뀌었으면 받아 오고, 양쪽이 따로 바뀌었으면 어느 쪽을 쓸지 사용자에게 묻는다.
- 서버가 기기에 먼저 보내지 않는다. 기기가 물어 가져간다.
- 다른 기기에서 '계정에서 지우기'로 지웠으면 그 기록을 다시 올리지 않고 동기화를 멈춘다.
- 기기마다 다른 것(동기화 상태 `accountSync`, 결제 알림 `notify`, 로컬 알림 설정)은 넣지 않는다.
- 서버는 받은 기록을 `parseBackup`으로 다시 검사한다. 계정을 지우는 경로를 새로 만들면
  `sessions`처럼 이 표도 직접 지운다 — `ON DELETE CASCADE`는 `PRAGMA foreign_keys`가 켜져 있을
  때만 동작한다.

화면의 기록은 주인(`recordsOwner`: 비로그인 null, 로그인하면 계정 ID)이 있고, 로그인 상태가 바뀌면
`lib/records-owner`가 주인별 칸(`subslash-records:*`)으로 바꿔 끼운다 — 예전에는 로그아웃해도 로그인한
동안의 기록이 비로그인 화면에 남았다. 이 기기에서 처음 로그인하는 계정만 로그인 전 기록을 가지고 들어가고,
로그아웃하면 로그인 전 모습으로 돌아온다. 계정에 이미 올라간 기록은 기기에 남기지 않고(빈 칸과 잊은 판만
둬서 다시 로그인하면 받아 온다), 올리지 못한 변경만 계정 칸에 둔다. 주인은 서버가 답한 로그인 상태로만
바꾼다 — 네트워크 오류를 로그아웃으로 읽지 않는다. 체험 중이면 체험은 두고 보관한 실제 기록만 바꾼다.
회원 탈퇴는 안내대로 기록을 지우지 않고 비로그인 기록으로 남긴다(`releaseRecordsToGuest`).

Gmail 자동 가져오기(`gmail_import_links`, `gmail_discoveries`)는 "서버가 브라우저로 되쓰지
않는다"의 유일한 예외이고, 그래서 좁게 묶어 둔다. SubSlash는 Google 권한을 받지 않는다 — 사용자
계정의 Apps Script가 2주마다 메일을 `/api/gmail/ingest`로 보내고(연결 토큰, 해시만 저장), 서버는
그 자리에서 파싱해 **구독 후보만** 남긴다. 메일 제목·본문을 표나 로그에 남기지 않는다. 브라우저는
로그인했을 때 후보를 가져가(`GET /api/gmail/discoveries`) 스스로 등록하고 받은 후보를 지운다 —
서버가 브라우저 기록을 고치는 것이 아니다. 알려진 서비스의 최근 결제만 확인 없이 등록하고, 이미
구독 중이면 등록하지 않으며, 해지한 서비스는 되살리지 않고 확인을 받는다. 후보에서 아주 빼는 것은
해지 알림뿐이다(`discoveryTier`) — 그건 결제가 끝났다는 증거다. 마지막 결제 메일이 오래된 것
(`STALE_AFTER_DAYS`, 월간 35일·연간 370일)은 **모른다**는 뜻이라 체크만 풀어 확인 목록에 남긴다. 버렸더니
1년에 한 번 영수증이 오는 연간 구독(굿노트)이 후보에 아예 나타나지 않아, 파싱을 몇 번 다시 돌려도
등록할 수 없었다. 같은 이유로 화면에도 '만료'라고 쓰지 않는다. 저장 항목이 늘어나는
기능이라 방침의 사전 고지를 따른다: `lib/privacy.ts`의 `GMAIL_AUTO_IMPORT_STARTS_ON`을 정하면 방침에
항목이 먼저 게시되고 그날부터 API·화면이 열린다(null이면 닫힘, 끊기는 언제나 된다). 테스트 서버만
`NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN`으로 연다. 계정을 지우는 경로는 `deleteGmailImportData`를
부른다.

'구글 캘린더에 결제일 등록'도 같은 웹 앱이 한다(`action=calendar`). 버튼은 '내 구독'(`/subs`) 맨
아래에 둔다 — 목록에서 금액·결제일을 확인하고 고친 뒤 마지막에 누르는 것이라, 가져오기 화면이
아니라 구독을 보는 화면에 있어야 한다. SubSlash는 캘린더 권한을 받지
않는다 — 버튼을 누르면 브라우저가 구독 중인 구독의 이름·금액·결제일을 계획으로 맡기고, 웹 앱이
접속한 사람의 권한으로 그 계획을 받아 **자기** 'SubSlash 결제일' 캘린더에 쓴다. 계획은 주소에 싣지
않고(`calendar_sync_plans`, 1회용 코드는 해시만) 받아 가면 곧바로, 늦어도 10분이면 지운다. 캘린더
쓰기는 전체 교체다 — 전에 SubSlash가 쓴 일정(`extendedProperties.private.subslash`)만 지우고 다시
쓴다. 날짜 계산과 RRULE은 캘린더 피드(`lib/ics.ts`)와 같은 함수를 쓴다. 일정 메모에는 해지 주소를
적는다 — 해지하려고 캘린더를 연 사람이 앱을 다시 열지 않아도 되게. 주소의 성격(`getCancelUrlKind`)에
따라 문구를 나누는 것은 화면과 같다(`cancelNoteFor`): 해지 화면이 아닌 주소를 '해지 페이지'라고
부르면, 눌러서 첫 화면만 보고 해지된 줄 아는 사람이 생긴다. 캘린더 피드(`/api/calendar/[token]`)도 같은 문구를 쓴다 — 알림 미러에
`cancel_url`을 두고(0010, 방침 시행일 2026-09-18), 브라우저가 미러에 올릴 때 함께 보낸다. 서버는
양쪽 모두 http(s)만 받는다. 피드(`/api/calendar/[token]`,
알림 설정)는 없애지 않는다 — 웹 앱이 없는 배포와 직접 설치 방식이 쓴다.

연결은 두 갈래다. 복사 방식은 사용자가 자기 계정에 스크립트를 붙여 넣어 Google 심사 대상이 아니다.
원클릭('Gmail 연결하기')은 **SubSlash 소유** Apps Script 웹 앱(접속한 사용자로 실행)이라 Google 심사 전에는
'확인되지 않은 앱' 경고와 새 사용자 100명 제한이 있고, 그 이상은 제한 권한 심사·연례 보안 평가가
필요하다 — 그래서 복사 방식을 없애지 않는다. 원클릭은 연결 토큰을 주소에 싣지 않는다: 주소에는 10분짜리
서명 코드(`gmail-connect`, 연결 지문 포함 → 한 번만 교환)만 싣고, 웹 앱이 `/api/gmail/connect/exchange`로
토큰을 받아 사용자별 저장소(UserProperties)에 둔다. 웹 앱 코드는 `lib/gmail-import.ts` 한 곳에만 있고
`pnpm --filter @subslash/web gmail:web-app -- --origins …`가 파일로 쓴다. 코드를 고치면 운영자가 웹 앱을
다시 배포해야 반영된다. 허용할 SubSlash 주소(`ALLOWED_ORIGINS`)와 `GMAIL_CONNECT_WEB_APP_URL`(두 Vercel
프로젝트)이 서로 맞아야 한다.

## 요청 수 제한

로그인 없이 메일을 보내는 곳(`/api/notify/subscribe`)과 비밀번호를 확인하는 곳(로그인, 비밀번호 변경,
회원 탈퇴)은 `lib/rate-limit`으로 횟수를 제한한다. 로그인은 실패만 세고(아이디·IP 기준), 계정을 잠그지
않고 잠시 기다리게 한다 — 잠그면 남이 일부러 틀려 주인을 못 들어오게 할 수 있다. 서버 인스턴스
메모리에 세므로 대량 공격을 완전히 막지는 못한다. 그건 Vercel 방화벽(WAF)의 속도 제한이 맡는다.
비밀값 비교(크론 `CRON_SECRET` 등)는 `timingSafeEqual`로 한다. 웹 응답의 보안 헤더(틀 넣기 금지 등)는
`next.config.ts`의 `headers()`에 있다.

## 구독 리포트와 익명 통계

하단 탭의 세 번째는 '리포트'(`/report`)다. 예전 '절약 현황'은 해지한 구독이 없으면 빈 화면이라, 해지
전에도 볼 것이 있게 지금 내는 돈·1회 단가 순위·다른 사용자와의 비교를 먼저 두고, 해지로 지킨 돈은 그
아래에서 `/savings`로 넘긴다(`/savings` 주소와 공유 링크는 그대로다).

다른 사용자와의 비교는 **동의한 기기의 익명 요약**으로만 만든다(`lib/stats`, `lib/stats-server`, 표
`stats_contributors`·`stats_items`). 보내는 것은 한 달 지출 합계(1,000원 단위)·구독 개수와, 서비스 목록에
있는 서비스마다 id·내 몫 한 달 금액(100원 단위)·최근 체크인 횟수뿐이다. 직접 적은 서비스 이름은 사람을
알아볼 수 있어 보내지 않는다. 계정·알림 구독자·IP와 묶지 않고, 토큰은 해시만 둔다. 참여자가 모자라면
(`STATS_MIN_PARTICIPANTS` 20, 서비스별 `STATS_MIN_PER_SERVICE` 10) 숫자 대신 몇 명이 모였는지만 말한다 —
몇 명뿐인 평균을 '보통'이라고 부르면 지어낸 숫자와 같다. 참여 여부와 토큰은 기기의 것이라 구독 기록
저장소·백업·동기화에 넣지 않는다(`lib/stats-client`). 180일 동안 갱신되지 않은 기록은 크론이 지운다.
저장 항목이 늘어나는 기능이라 `ANONYMOUS_STATS_STARTS_ON`(`lib/privacy.ts`)을 정하면 방침에 항목이 먼저
게시되고 그날부터 열린다. **열기 전에 두 배포 DB에 `drizzle/0011_anonymous_stats.sql`을 적용한다.**

DB는 정보 종류별로 나누지 않는다. 같은 서버가 모든 접속 키를 쥐므로 나눠도 막아 주는 것이 거의 없고,
회원 탈퇴처럼 여러 표를 함께 지우는 일이 DB 사이에서는 한 번에 되지 않아 방침의 '곧바로 지운다'를
지키기 어려워진다. 대신 표끼리 묶지 않고(알림 ↔ 계정, 통계 ↔ 누구도), 토큰은 해시로, 필요한 칸만 둔다.

## 여러 기기 사용 측정

체크인(사용자가 센 횟수)과 별개로, 안드로이드 앱이 '사용 정보 접근'으로 서비스 앱이 화면 맨 앞에 있던
구간을 재 로그인 계정에 올린다(`DeviceUsagePlugin` → `lib/device-usage-client` → `/api/usage`, 표
`usage_devices`·`usage_intervals`). 기기마다 자기 구간만 기간 단위로 통째로 바꿔 올리므로 기기끼리
충돌하지 않고, 읽을 때 계정의 모든 기기 구간을 `linkSessions`(@subslash/shared)로 잇는다 — 앞 사용이
끝나고 30분 안에 다시 쓰면 기기가 달라도 한 번, 1분 미만은 세지 않는다. 잴 수 있는 것은 '앱이 앞에
있었다'뿐이라 TV·PC·iPhone·화면 끈 재생·배속은 없다. 그래서 값은 "측정한 기기에서 최소 N회"이고
체크인을 덮어쓰지 않으며, 측정 기간(`measuredFrom`~`measuredUntil`) 밖은 '안 썼다'가 아니라 모른다
(이전 업로드와 사이가 비면 측정 기간을 이어 붙이지 않는다). 패키지 이름(`ANDROID_PACKAGES`)은 Play
스토어에서 확인한 것만 적는다. 보관 40일(크론이 지움), 회원 탈퇴는 `deleteAllDeviceUsage`.
`DEVICE_USAGE_STARTS_ON`(null이면 닫힘)을 정하기 전에 두 배포 DB에 `drizzle/0012_device_usage.sql`을
적용하고, 사용 정보 접근 권한에 대한 스토어 정책을 확인한다. 매니페스트의 `PACKAGE_USAGE_STATS`는
측정을 켜는 화면이 생길 때까지 주석으로 빼 두었다 — 쓰지 않는 민감 권한을 스토어 심사에 내지 않는다.

## 파일 경계

화면에 보이는 결제 내역은 전부 사용자가 실제로 넘긴 것이다. 지어낸 영수증을 만드는
코드는 없다.

예전에는 메일 연동이 없는 동안 `NEXT_PUBLIC_SHOW_INBOX_PREVIEW` 뒤에 예시 영수증을
만들어 보여 주는 '메일함 스캔' 탭이 있었다(`utils/inbox-simulation.ts`,
`InboxPreviewPanel.tsx`). Gmail 가져오기가 생겨 그 자리를 실제로 채웠으므로 2026년 9월
19일에 플래그·픽스처·화면을 모두 지웠다. 다시 만들지 않는다 — 그 탭은 등록을 누르면
예시 데이터를 진짜 구독 목록에 써 넣었다.

Gmail 결제 메일 가져오기(`/import`, `lib/gmail-import.ts`)는 SubSlash가 Gmail에 연결하는 것이
아니다. 사용자가 자기 계정에 만든 Apps Script가 메일을 찾아 `/import#gmail=…`로 넘기고, 브라우저가
`#` 뒤를 풀어 `parseReceiptEmails`로 후보를 만든다. `#` 뒤는 서버로 가지 않으므로 메일 내용은
서버를 거치지 않는다 — 이 값을 API로 보내거나 쿼리(`?`)로 옮기지 않는다. 스크립트 권한은
`gmail.readonly` 하나다(`GmailApp`은 전체 권한을 요구하고, 읽기 전용으로 좁히면 빈 결과를 준다).
메일 본문에는 광고·약관이 섞이므로, 메일은 해지 여부를 제목으로, 결제일을 받은 날로 판단하고
알아보지 못한 서비스는 본문 단어가 아니라 '알 수 없는 결제'로 이름 짓는다. 메일함 검색에는 광고와
뉴스레터도 함께 걸리므로, **결제가 일어났다는 증거**(영수증·결제 금액·charged 등, `PAYMENT_EVIDENCE`)가
없는 메일은 후보로 만들지 않는다 — '구독'·'subscription'은 수신 설정 안내에도 나오므로 증거가 아니다
(챗GPT 광고 메일의 '$20/month'가 쓰지도 않는 구독으로 등록됐다). 서비스 이름은 보낸 사람의
도메인(`senderDomains`) → 제목 → 본문 순으로 찾고, 보낸 사람이 아는 서비스면 본문은 보지 않는다.
본문에서만 찾은 이름은 `confidence: "medium"`이라 사용자가 골라야 등록된다 — 한 메일로 여러 서비스를
청구하는 발신자(`PLATFORM_SENDER_DOMAINS`, 구글 플레이·앱스토어)만 예외다. 그 발신자의 영수증에 아는
서비스가 둘 이상 적혀 있으면 항목별로 쪼개 후보를 여럿 만든다(`splitPlatformReceipt`) — 메일 한 통을
후보 하나로 읽으면 키워드 표에서 앞선 서비스만 남고 그 이름에 뒤 항목의 금액·주기가 붙는다(굿노트
연간 13,000원이 '아이클라우드'로 등록됐다). 금액이 없는 조각과 어느 앱인지 모를 때 쓰는 묶음
프리셋(`apple-app-store` 등)은 후보로 만들지 않는다. 결제 주기가 하나뿐인 서비스(굿노트,
`onlyBillingCycle`)는 영수증에 '연간'이 없어도 그 주기로 읽는다 — 애플 영수증은 갱신일만 적기도 해서,
월 결제로 읽었더니 3월 영수증이 반년 뒤 '오래된 메일'이 되어 자동으로 등록되지 않았다. 검색은 네 갈래
(앱스토어·구글 플레이 영수증 / `category:purchases`+구독 낱말 / 그 분류 전체 / 결제 낱말)로 나눠 자리를 나눠 쓴다 — 한 갈래에 상한을
다 맡기면 쇼핑 주문이 자리를 채워 1년에 한 번 오는 연간 구독 영수증이 밀린다.

## 로고와 이모지

브랜드 마크는 `components/brand/Brand.tsx` 한 곳에 있다(마크·워드마크·락업). 좌표와 색은 브랜드
시트에서 뽑은 값이고, 앱 아이콘(`app/icon.svg`)도 같은 좌표를 쓴다 — 한쪽만 고치면 상단 바와 홈
화면 아이콘이 서로 다른 로고가 된다. 모바일 앱의 아이콘·스플래시(안드로이드 `res/`, iOS
`Assets.xcassets`)는 `icon.svg`에서 만든 그림이다 — `icon.svg`를 고치면
`pnpm --filter @subslash/mobile assets`를 다시 돌린다(Capacitor 기본 그림이 남아 있어 앱만 다른 로고였다). 워드마크 가운데의 빨간 슬래시는 글꼴의 `/`가 아니라 기울인
막대이고, 읽는 기계에는 `Sub/Slash`로 들리도록 따로 적는다.

서비스 로고(`lib/service-logos.ts`)는 **확인한 것만** 적는다. 글리프를 눈대중으로 그리거나 브랜드
색을 지어내지 않고, 공식 앱 아이콘을 쓸 때는 어디서 받아 왔는지 `source`에 남긴다. 셋 다 없으면
이니셜 마크에 중립 회색이다. 리디처럼 브랜드 마크 자체가 글자인 곳이 있으니, 글자로 보인다고
폴백이라 단정하지 않는다.

화면에는 이모지를 쓰지 않는다. 버튼·제목·토스트 앞의 이모지는 글자가 이미 하는 말을 되풀이하면서
기기와 글꼴마다 다른 그림으로 나오고, 읽는 기계에는 이름이 그대로 읽힌다(147개를 걷어냈다).
뜻이 있는 자리에는 이모지 대신 `lucide-react` 아이콘을 쓴다 — 기다리는 중은 `ui/spinner`, 빈
화면은 그 화면이 기다리는 것을 말하는 아이콘. 색·상태는 배지 색처럼 이미 쓰는 수단으로 말한다.
화살표(`→ ↑ ↓ ←`)는 방향을 가리키는 글자라 이모지가 아니다. 사용자가 직접 넣은 아이콘
(`iconUrl`)과 서비스 목록의 `iconEmoji`는 사용자 데이터라 건드리지 않는다. E2E 선택자에 화면
문구를 쓸 때도 이모지를 넣지 않는다 — 문구에서 이모지를 빼면 선택자가 조용히 어긋난다.

## 앱(Capacitor)에 담을 화면

모바일 앱은 이 웹 화면을 정적으로 내보내 앱 안에 담고, API만 배포된 Vercel을 부른다.
그래서 화면 코드는 다음을 지킨다.

- 서버 API는 `apiUrl("/api/...")`(`lib/api`)로 부른다. 앱 안의 상대 주소는 앱 자신을 가리킨다.
  로그인이 필요한 요청(`/api/auth`·`/api/account`·`/api/gmail`·`/api/calendar-sync`, 서버가
  `readSessionToken`으로 읽는 곳 전부)은 `apiFetch()`로 보낸다. 앱에는 쿠키가 실리지
  않아서, `apiFetch`가 기기에 둔 세션 토큰(`lib/session-token`)을 헤더로 싣고 로그인·가입·비밀번호
  변경 응답의 새 토큰을 받아 둔다. 그냥 `fetch`로 부르면 앱에서만 로그인하지 않은 것으로 읽힌다(Gmail
  자동 가져오기가 로그인한 앱에서 '로그인이 필요합니다'를 냈다).
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
  인앱 브라우저에 띄우는 외부 화면(Apps Script 웹 앱)도 웹사이트로 가는 링크를 두지 않는다 — 서버가
  앱 출처의 요청에 `client=app`을 붙이면 웹 앱은 '창을 닫으면 앱으로 돌아갑니다'를 띄운다. 링크를 두면
  인앱 브라우저에 웹이 열리고, 웹에 로그인돼 있으면 찾은 구독을 웹이 먼저 받아 가 앱에는 오지 않는다.
- 남에게 보낼 링크는 `webUrl()`로 만든다. 앱에서 `window.location.origin`은
  `capacitor://localhost`(iOS)나 `https://localhost`(안드로이드)다.
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

앱 화면은 `pnpm --filter @subslash/web build:app`(정적 내보내기 → `apps/web/out`)으로 만들고,
`apps/mobile`(Capacitor 8, appId `com.subslash.app`)이 그 폴더를 담는다. 빌드에는 앱이 부를 배포
주소(`NEXT_PUBLIC_WEB_ORIGIN`)가 꼭 있어야 하고, 없으면 빌드를 멈춘다. 앱에서만 달라지는 동작은
`IS_APP_BUILD`(`lib/platform`)로 가른다. CI가 이 빌드를 돌려 정적 내보내기를 깨는 코드를 막는다.
안드로이드 빌드·실행은 README의 '모바일 앱'에 있다.

`apps/mobile`은 안드로이드(`android/`)와 iOS(`ios/`)를 모두 담는다. iOS 프로젝트는 Capacitor 8이
CocoaPods 대신 SPM을 쓰므로 Windows에서도 만들어지지만, **빌드는 macOS나 EAS의 macOS 작업 서버에서만**
된다. 실기기·TestFlight·스토어는 Apple 개발자 프로그램이 있어야 하고, 계정 없이 되는 것은 시뮬레이터
빌드(`eas.json`의 `preview.ios.simulator`)뿐이다. 네이티브 플러그인은 안드로이드에만 있으므로
(`AppWindowPlugin`), 플러그인을 부르는 코드는 `Capacitor.getPlatform()`으로 가른다 — iOS에서 부르면
거절당해 경고만 쌓인다.

앱의 구독 기록은 웹처럼 localStorage가 원본이고, 쓸 때마다 기기 저장소(Preferences)에 사본을
적는다(`lib/mirrored-storage`). 앱을 열 때 localStorage가 비어 있었으면 사본으로 되살린다 — 운영체제가
웹뷰 저장소를 비워도 기록이 남게 하려는 것이다. 저장소를 통째로 Preferences로 옮기지 않는 이유는 그
파일에 있다. 상태 표시줄 색은 테마를 따라 `syncSystemBars`(`lib/native`)가 맞춘다.

앱의 결제 알림은 기기 안의 로컬 알림이다(`lib/local-reminders`가 목록을 정하고
`lib/native-reminders`가 건다). 서버를 거치지 않아 로그인 없이 쓰고, 이메일 알림(`notify`)과는 별개다.
알림 권한은 앱을 켤 때가 아니라 사용자가 '알림 켜기'를 누를 때 묻는다. 정확한 시각 알람
(`SCHEDULE_EXACT_ALARM`)은 매니페스트에서 뺀다 — 몇 분 늦어도 되는 알림에 사용자가 따로 켜야 하는
권한을 요구하지 않는다. 결제 월을 모르는 연간 구독은 날짜가 없으므로 알리지 않는다. 켜짐·며칠 전
설정은 기기마다 다르므로 스토어·백업·동기화에 넣지 않는다.

클라우드 빌드는 EAS Build를 쓴다(`apps/mobile/eas.json`, Expo 프로젝트 `@leesean2/subslash-mobile`). 앱은
Expo가 아니라 Capacitor이므로 `expo` 패키지를 넣지 않는다 — EAS는 `app.json`·`eas.json`만 읽는다. EAS의
Android 이미지에는 JDK 17뿐인데 Capacitor 8은 Java 21로 컴파일해서, 설치 뒤 훅
(`scripts/eas-build-post-install.sh`)이 JDK 21을 받고 웹 화면을 만들어 `cap sync`한다. EAS는 작업 폴더를
`.gitignore` 기준으로 올린다. `.easignore`를 만들면 `.gitignore`를 통째로 대신해서 `.env`까지 올라갈 수
있으니 만들지 않는다.

`tools/ipad-preview`는 Mac 없이 iPad·iPhone의 Expo Go로 화면을 iPhone에서 보는 모습 그대로 보는
도구다(iPad는 iPhone 크기 틀, iPhone은 전체 화면. 사용법은 그 폴더의 README). pnpm 워크스페이스 밖이라 npm으로 따로 설치하고, CI·웹 빌드에 들어가지 않는다.
출시할 앱이 아니므로 네이티브 기능은 여기서 확인할 수 없다.

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
- 배포 DB는 두 개이고 데이터를 섞지 않는다. `subslash`는 leesean2/subslash(Vercel
  `subslash-web-qki1`), `subslash-grad`는 Grad-Deploy/subslash 미러(Vercel `subslash-web`)가
  쓴다. 미러가 병합 즉시 새 레포로 옮겨 곧바로 배포되므로, 스키마를 바꾸는 PR은 병합
  전에 **두 DB 모두** 마이그레이션 SQL을 적용한다. 한쪽만 적용하면 다른 쪽 배포에서 새
  테이블을 쓰는 화면이 500을 낸다.
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
