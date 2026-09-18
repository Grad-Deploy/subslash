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

`account_snapshots`는 로그인한 사람이 '계정에 저장'을 직접 눌렀을 때만 생기는 백업
파일 한 벌이다. 알림 미러와 같은 규칙을 따른다 — 전체 교체, 병합 없음, 서버가 알아서
브라우저로 되쓰지 않음('계정에서 불러오기'를 눌러야 받는다). 서버는 받은 기록을
`parseBackup`으로 다시 검사하고, 동기화 토큰(`notify`)은 넣지 않는다. 계정을 지우는
경로를 새로 만들면 `sessions`처럼 이 표도 직접 지운다 — `ON DELETE CASCADE`는
`PRAGMA foreign_keys`가 켜져 있을 때만 동작한다.

Gmail 자동 가져오기(`gmail_import_links`, `gmail_discoveries`)는 "서버가 브라우저로 되쓰지
않는다"의 유일한 예외이고, 그래서 좁게 묶어 둔다. SubSlash는 Google 권한을 받지 않는다 — 사용자
계정의 Apps Script가 2주마다 메일을 `/api/gmail/ingest`로 보내고(연결 토큰, 해시만 저장), 서버는
그 자리에서 파싱해 **구독 후보만** 남긴다. 메일 제목·본문을 표나 로그에 남기지 않는다. 브라우저는
로그인했을 때 후보를 가져가(`GET /api/gmail/discoveries`) 스스로 등록하고 받은 후보를 지운다 —
서버가 브라우저 기록을 고치는 것이 아니다. 알려진 서비스의 최근 결제만 확인 없이 등록하고, 이미
구독 중이면 등록하지 않으며, 해지한 서비스는 되살리지 않고 확인을 받는다. 저장 항목이 늘어나는
기능이라 방침의 사전 고지를 따른다: `lib/privacy.ts`의 `GMAIL_AUTO_IMPORT_STARTS_ON`을 정하면 방침에
항목이 먼저 게시되고 그날부터 API·화면이 열린다(null이면 닫힘, 끊기는 언제나 된다). 테스트 서버만
`NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN`으로 연다. 계정을 지우는 경로는 `deleteGmailImportData`를
부른다.

'구글 캘린더에 결제일 등록'도 같은 웹 앱이 한다(`action=calendar`). SubSlash는 캘린더 권한을 받지
않는다 — 버튼을 누르면 브라우저가 구독 중인 구독의 이름·금액·결제일을 계획으로 맡기고, 웹 앱이
접속한 사람의 권한으로 그 계획을 받아 **자기** 'SubSlash 결제일' 캘린더에 쓴다. 계획은 주소에 싣지
않고(`calendar_sync_plans`, 1회용 코드는 해시만) 받아 가면 곧바로, 늦어도 10분이면 지운다. 캘린더
쓰기는 전체 교체다 — 전에 SubSlash가 쓴 일정(`extendedProperties.private.subslash`)만 지우고 다시
쓴다. 날짜 계산과 RRULE은 캘린더 피드(`lib/ics.ts`)와 같은 함수를 쓴다. 피드(`/api/calendar/[token]`,
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

## 파일 경계

실제로 동작하는 코드와, 플래그 뒤의 미리보기용 픽스처를 섞지 않는다. 실제
Gmail/네이버 연동이 생기면 아래 오른쪽 열을 통째로 지운다.

| 실동작                | 미리보기 (`NEXT_PUBLIC_SHOW_INBOX_PREVIEW`, 기본 off) |
| --------------------- | ----------------------------------------------------- |
| `utils/parser.ts`     | `utils/inbox-simulation.ts`                           |
| `AutoImportModal.tsx` | `InboxPreviewPanel.tsx`                               |

Gmail 결제 메일 가져오기(`/import`, `lib/gmail-import.ts`)는 SubSlash가 Gmail에 연결하는 것이
아니다. 사용자가 자기 계정에 만든 Apps Script가 메일을 찾아 `/import#gmail=…`로 넘기고, 브라우저가
`#` 뒤를 풀어 `parseReceiptEmails`로 후보를 만든다. `#` 뒤는 서버로 가지 않으므로 메일 내용은
서버를 거치지 않는다 — 이 값을 API로 보내거나 쿼리(`?`)로 옮기지 않는다. 스크립트 권한은
`gmail.readonly` 하나다(`GmailApp`은 전체 권한을 요구하고, 읽기 전용으로 좁히면 빈 결과를 준다).
메일 본문에는 광고·약관이 섞이므로, 메일은 해지 여부를 제목으로, 결제일을 받은 날로 판단하고
알아보지 못한 서비스는 본문 단어가 아니라 '알 수 없는 결제'로 이름 짓는다.

## 앱(Capacitor)에 담을 화면

모바일 앱은 이 웹 화면을 정적으로 내보내 앱 안에 담고, API만 배포된 Vercel을 부른다.
그래서 화면 코드는 다음을 지킨다.

- 서버 API는 `apiUrl("/api/...")`(`lib/api`)로 부른다. 앱 안의 상대 주소는 앱 자신을 가리킨다.
- 남에게 보낼 링크는 `webUrl()`로 만든다. 앱에서 `window.location.origin`은 `capacitor://`다.
- 페이지에 동적 경로(`[id]`)를 새로 만들지 않는다. 브라우저에서 만든 ID로는 페이지를 미리
  만들 수 없다. 구독 상세는 `subscriptionDetailHref()`(`/subs/detail?id=`)를 쓴다.
- 브라우저 기본 `confirm`·`prompt`·`alert`를 쓰지 않는다. 창 밖에서는 `ConfirmDialog`, 이미
  열린 창 안에서는 `InlineConfirm`을 쓴다(창을 겹치면 같은 Esc에 함께 닫힌다).

`tools/ipad-preview`는 Mac 없이 iPad의 Expo Go로 화면을 iPhone 크기 그대로 보는 도구다(사용법은
그 폴더의 README). pnpm 워크스페이스 밖이라 npm으로 따로 설치하고, CI·웹 빌드에 들어가지 않는다.
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
- E2E는 CI와 같게 `--workers=1`로 돌린다. 기본 병렬로는 샘플 데이터 테스트가
  30초 테스트 타임아웃에 걸리는 기존 flake가 있다.
- 커밋 메시지는 한국어로, "무엇을 왜"를 쓴다. 무엇이 잘못돼 있었고 사용자에게
  어떻게 보였는지가 핵심이다.
