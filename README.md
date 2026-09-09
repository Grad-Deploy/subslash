# ✂️ SubSlash — 구독, 끊을 용기

> 매달 빠져나가는 구독료, 정말 그만한 가치가 있을까요?

**SubSlash**는 구독 서비스의 실제 가치를 추적하고, 불필요한 결제를 즉시 차단(해지)하도록 돕는 **능동형 구독 디톡스 웹 서비스**입니다.

## 🎯 핵심 기능

### 1. 💰 1회 사용 단가(Cost-Per-Use) 체감 엔진

- 결제일 3일 전, 이메일로 단 하나의 질문: **"지난 30일 동안 몇 번 이용하셨나요?"**
- 메일 본문의 `0회 / 1회 / 3회 / 5회 / 10회` 버튼을 한 번 누르면 바로 결과 화면
- 충격 요법 UI: `"이번 달 영화 1편을 ₩17,000에 보셨습니다"`
- 가성비 신호등: 🟢 유지 · 🟡 주의 · 🔴 해지 권고

### 2. 🔪 1초 해지 직통 링크 (Kill-Switch)

- 국내 주요 20+ 구독 서비스의 해지 페이지 다이렉트 URL
- 다크 패턴 탈출 30초 가이드

### 3. 📊 방어 자산(Saved Pot) 시각화

- 해지 완료 구독의 연간 절약 금액 누적
- "맛있는 치킨 3마리를 살 수 있어요" — 절약액이 실제로 감당하는 보상만 보여주고,
  아직 모자라면 아무것도 약속하지 않습니다

## 🏗️ 기술 스택

| 영역       | 기술                         |
| ---------- | ---------------------------- |
| 프레임워크 | Next.js 15 (App Router)      |
| 스타일링   | Tailwind CSS 4               |
| 상태관리   | Zustand + localStorage       |
| DB         | Turso (libSQL) + Drizzle ORM |
| 알림       | Resend (이메일)              |
| 배포       | Vercel (서버리스)            |
| 모노레포   | Turborepo + pnpm             |
| 테스트     | Vitest + Playwright          |

## 📁 프로젝트 구조

```
subslash/
├── apps/web/          # Next.js 웹 앱 (PWA)
│   ├── app/           # App Router 페이지 & API (/, /dashboard, /subs, /savings, /share)
│   ├── components/    # UI 컴포넌트
│   ├── lib/           # 스토어, DB, 유틸
│   └── hooks/         # React 커스텀 훅
├── packages/shared/   # 공유 타입, 유틸, 상수
└── (harness)          # Turborepo, ESLint, Husky, CI/CD
```

> 금액 합산은 `@subslash/shared`의 `sumMonthlyKRW` / `sumAnnualKRW`를 사용합니다.
> USD 구독과 연간 결제 구독을 월/연 단위 원화로 환산해 더하므로, 새 합산 로직을
> 직접 `reduce`로 작성하지 말고 이 헬퍼를 재사용하세요.

## 🚀 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 9+

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 시작
pnpm dev
```

### 테스트

```bash
# 단위/통합 테스트
pnpm test

# E2E 테스트 (최초 1회: npx playwright install chromium)
pnpm test:e2e

# 린트 & 타입체크
pnpm turbo lint typecheck
```

## 🌟 Zero-Friction 온보딩

회원가입 없이 바로 시작합니다:

1. 첫 방문 시 구독 3개를 즉시 등록
2. 브라우저 localStorage에 데이터 저장
3. 알림이 필요할 때만 이메일 입력

## 🔔 결제 알림 아키텍처 (미러 모델)

기본 경험은 100% 로컬·익명입니다. 서버는 **알림을 켠 사용자에 한해서만**,
그것도 알림에 필요한 최소 정보만 보관합니다.

```
localStorage (원본)  ──PUT /api/notify/sync──▶  서버 미러
    │                                              │
    │ 체크인·절약자산·해지구독·연동계정              │ 이메일 · 이름 · 금액 · 결제일
    │ (전송되지 않음)                               ▼
    └──────◀── /check-in?sub=&count= ────  일일 크론 → Resend 이메일
```

- **단방향 동기화**: 서버는 절대 클라이언트로 되쓰지 않습니다. 동기화는 전체 교체
  방식이라 병합·충돌 해결이 없고, 마지막으로 동기화한 기기가 서버 상태를 정의합니다.
- **옵트인 + 이메일 확인**: 확인 링크를 누르기 전에는 어떤 알림도 발송되지 않습니다.
- **원탭 체크인**: 메일의 버튼은 서버를 거치지 않고 해당 기기의 localStorage에
  기록합니다. 따라서 토큰도, 왕복도 없습니다.
- **수신 거부 = 완전 삭제**: 서버가 갖고 있던 모든 행이 함께 지워집니다.

### 로컬에서 알림 흐름 테스트하기

```bash
cp .env.example apps/web/.env.local   # CRON_SECRET만 채우면 충분합니다
cd apps/web && pnpm db:push           # TURSO_* 미설정 시 로컬 SQLite 사용
pnpm dev

# RESEND_API_KEY가 없으면 메일을 보내지 않고 서버 로그에 출력합니다
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/notify
```

## 📱 모바일 / PWA

- 웹 매니페스트 + 서비스 워커(`public/sw.js`)로 설치형 PWA로 동작합니다. 홈 화면에
  추가하면 전체 화면으로 실행되고, 네트워크가 없을 때는 `/offline` 안내 화면이 뜹니다.
- Android: 설치 후 공유 시트에서 SubSlash를 고르면 결제 문자·영수증이 `/share`로
  넘어와 그대로 파싱됩니다 (`manifest.json`의 `share_target`).
  `/share?text=<결제문자>`로 직접 열어도 동일하게 동작합니다.
- 서비스 워커는 오프라인 안내 화면 하나만 캐시합니다. 구독 데이터는 localStorage에
  있고 페이지도 작아서, 앱 셸을 캐시해봐야 배포 후 옛 빌드가 남을 위험만 커집니다.

## 📄 라이선스

MIT
