# 첫 화면(소개)과 앱 온보딩

> CLAUDE.md에서 옮겨 온 설명서다(내용은 바꾸지 않았다). 본문의 '위'·'아래'·'작업 절차' 같은 말은 CLAUDE.md의 절을 가리킨다.

**언제 읽나:** `components/home/Landing`, `components/launch/AppOnboarding`, `landing:screens` 캡처를 고칠 때.

웹의 `/`는 내려 읽는 소개 페이지다(앱은 아래 문단을 본다). 무엇을 하는 서비스인지만 알리고, 등록·체크인처럼 쓰는 일은
대시보드로 보낸다 — 이 화면에 등록 창을 다시 두지 않는다. 모양은 Claude Design 프로젝트의 `Landing v2.dc.html`을 따른다:
첫 칸의 장면(질문·결제 알림 → '가격 말고 1회당 단가로.'·시작하기·샘플), 1회당 단가 계산기(`UnitCostCalculator`), 한눈에
보기(폰 셋), 해지 안내·메일로 찾기, 지킨 돈(어두운 칸), 안심하고 쓰세요, 마무리(`components/home/Landing`). 디자인의 헤더
메뉴·테마 버튼·푸터는 앱 공통 헤더·푸터가 맡아 옮기지 않았다. 움직임은 CSS만 쓴다(globals.css의 `opening-*`·`landing-*`) —
첫 칸의 장면은 스크롤 애니메이션(view-timeline)을 아는 브라우저에서만 칸이 길어지고 화면에 머문 채 바뀐다. 모르는 브라우저와
움직임 줄이기에서는 앞 장면 없이 시작하기 칸만 처음부터 보이고, JS로 숨기지 않는다. 첫 칸의 결제 알림은 서비스 목록 기준 요금으로
만든 예시라 그렇게 적고(`components/home/samples`, 계산기와 같은 목록), 요금제가 여럿인 서비스는 요금제까지 적는다. 기능 소개의
화면은 Play 스토어용으로 샘플 데이터로 찍은 앱 캡처(`public/landing/`, 영어 화면은 `public/landing/en/`)이고 화면에 그렇게
밝힌다 — 경로는 `components/home/screens`의 `landingScreen`이 화면 언어로 고른다. 화면이 크게 바뀌면
`pnpm --filter @subslash/web landing:screens [-- --lang ko]`로 새로 찍는다(앱 빌드를 휴대폰 크기로 열어 예시 기록을 설정 →
복원으로 넣고 찍는다, `scripts/landing-screens/capture.ts`). '앱 받기'(`AppDownloadLink`)는 Google Play의 스토어
페이지(`PLAY_STORE_URL`, `lib/play-store`)로 간다. 웹의 푸터와, 안드로이드 앱에서만 되는 기능을 웹에서 안내하는 문장(설정의
여러 기기 사용 측정·리포트의 구독별 사용량)에도 같은 링크(`PlayStoreLink`, 앱에서는 그리지 않음)를 둔다 — 비공개 테스트 동안에는 받을 수 없는 주소를 걸지 않으려고 링크 없는 '준비 중' 표시였다.

앱은 `/`를 열자마자 대시보드로 옮기고, 처음 실행할 때만 인트로 뒤에 옆으로 넘기는 소개(`components/launch/AppOnboarding`)를
덮어 보여 준다. 모양은 Claude Design의 `App Onboarding v2.dc.html`(문제 · 답 · 1회당 단가 계산기 · 기능 3장 · 직접 해 보기)이고,
마지막 장에서 쓰는 구독을 고르거나 샘플·로그인으로 가면 다시 띄우지 않는다(`lib/welcome`, 기기 저장소). 고른 서비스는 바로
등록하지 않고 대시보드에 넘겨(`queueWelcomePicks`) 등록 창을 하나씩 연다(`useAddSubscriptionFlow`의 `openQueue`) — 요금제가
여럿인 서비스의 요금과 결제일은 사용자가 정해야 하므로, 고르는 칸에도 요금제가 하나뿐인 서비스만 금액을 적는다. 소개를 크게
바꿀 때마다 키를 바꿔(지금은 `subslash-onboarding-v2-seen`) 예전 소개를 본 사용자도 업데이트 뒤 새 소개를 한 번 본다. 웹 번들에 들어가지
않도록 `virtual:app-launch-flow`로만 불러온다(`AppLaunch`).
