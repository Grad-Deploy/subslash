# SubSlash 개발 안내

서비스 소개는 [README](../README.md)에 있습니다. 이 문서는 코드를 내려받아 고치고 배포하는 사람을 위한 것입니다.
코드를 고칠 때 지켜야 할 규칙(금액 합산 헬퍼, 결제일 계산, 데이터를 어디에 두는지, 앱에 담을 화면이 지킬 것 등)은
[CLAUDE.md](../CLAUDE.md)에 있습니다. 이 저장소의 제1원칙은 **모르는 것을 지어내지 않는다**입니다 — 값이 없거나
확실하지 않으면 그럴듯한 기본값으로 채우지 않고, 모른다고 표시합니다.

## 기술 스택

| 영역       | 기술                               |
| ---------- | ---------------------------------- |
| 프레임워크 | Next.js 16 (App Router), React 19  |
| 스타일링   | Tailwind CSS 4                     |
| 상태관리   | Zustand + localStorage             |
| DB         | Turso (libSQL) + Drizzle ORM       |
| 메일       | Resend (가입 확인·비밀번호 재설정) |
| 배포       | Vercel                             |
| 모바일     | Capacitor 8 (안드로이드), EAS      |
| 모노레포   | Turborepo + pnpm                   |
| 테스트     | Vitest + Playwright                |

## 프로젝트 구조

```
subslash/
├── apps/web/          # Next.js 웹 앱 (PWA, 앱에 담을 정적 화면도 여기서 만든다)
│   ├── app/           # App Router 페이지와 API
│   ├── components/    # UI 컴포넌트
│   ├── lib/           # 스토어, DB, 서버 로직, 네이티브 연결, 화면 문구(i18n)
│   ├── hooks/         # React 커스텀 훅
│   └── drizzle/       # DB 마이그레이션 SQL
├── apps/mobile/       # Capacitor 앱 (안드로이드)
├── apps/usage-cli/    # PC의 AI 코딩 도구 사용을 체크인으로 넘기는 명령줄 도구
└── packages/shared/   # 공유 타입, 서비스 목록, 금액·결제일 계산
```

## 시작하기

필요한 것: Node.js 20 이상(모바일 빌드는 22 이상), pnpm 9

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # 비워 두면 로컬 SQLite(file:local.db)를 쓴다
pnpm dev
```

`RESEND_API_KEY`가 없으면 메일을 보내지 않고 메일 본문(확인 링크 포함)을 서버 로그에 찍습니다. 간편 로그인·
Gmail 원클릭 연결·리포트에 물어보기 AI처럼 바깥 키가 필요한 기능은 키가 없으면 버튼이 뜨지 않거나 닫힌 채로
동작합니다(`.env.example` 참고).

### 확인

```bash
pnpm turbo lint typecheck
pnpm test
pnpm build

# E2E (처음 한 번: npx playwright install). CI와 같게 한 번에 하나씩 돌린다
pnpm --filter @subslash/web test:e2e -- --workers=1
```

## DB 마이그레이션

배포 DB는 두 개이고 데이터를 섞지 않습니다.

| DB              | 쓰는 곳                                                       |
| --------------- | ------------------------------------------------------------- |
| `subslash`      | leesean2/subslash (Vercel `subslash-web-qki1`)                |
| `subslash-grad` | Grad-Deploy/subslash 미러 (Vercel `subslash-web`, 공개 웹·앱) |

미러는 병합 즉시 배포되므로, 스키마를 바꾸는 PR은 **병합 전에 두 DB 모두** 마이그레이션 SQL을 적용합니다.
한쪽만 적용하면 다른 쪽 배포에서 새 테이블을 쓰는 화면이 500을 냅니다. **지우는 변경은 순서가 반대입니다** —
그 칼럼·표를 쓰지 않는 코드가 두 배포에 나간 뒤에 DROP을 적용합니다.

```bash
cd apps/web
pnpm db:generate                 # 스키마를 바꿨으면 SQL을 만든다 (오프라인)
pnpm db:apply                    # 대상 DB에 적용됐는지 보여 주기만 한다
pnpm db:apply -- --apply 0019    # 번호를 줘야 한 트랜잭션으로 적용한다
```

배포 DB에는 `db:push`를 쓰지 않습니다. 테이블·칼럼 이름 변경을 "새로 만들지, 이름을 바꿀지" 묻는데, 만들기를
고르면 기존 테이블이 지워집니다.

## 로그인과 계정의 보안

- **비밀번호**는 사용자마다 다른 솔트를 붙인 scrypt 해시로만 둡니다. 서버도 비밀번호를 알 수 없습니다.
- **세션**은 웹에서는 httpOnly 쿠키, 앱에서는 `Authorization` 헤더로 보냅니다. 서버에는 토큰의 SHA-256만 둡니다.
- **로그인 실패 메시지**는 하나뿐입니다. 없는 아이디와 틀린 비밀번호를 나눠 알려 주면 가입된 아이디를 훑어낼 수 있습니다.
- **가입 이메일 확인**·**비밀번호 재설정** 링크는 여는 것만으로 아무것도 바꾸지 않고, 버튼이 보내는 POST로만
  바꿉니다. 메일 검사기가 링크를 사람보다 먼저 열어 보기 때문입니다. 메일은 주소마다 1분 1통, 24시간 5통까지입니다.
- 구글·카카오·네이버 간편 로그인은 제공자 키가 있고 시작일(`lib/privacy.ts`)이 지났을 때만 열립니다. 회원 번호는
  해시로만 두고 제공자 토큰은 저장하지 않습니다.
- 만 14세 미만은 받지 않습니다. 가입할 때 "만 14세 이상입니다" 확인을 받습니다.

### 메일을 보내는 엔드포인트의 IP 제한 (Vercel WAF)

가입, 확인 메일 재발송, 비밀번호 재설정은 모르는 사람에게 메일을 보낼 수 있는 입구입니다. 주소마다 세는 제한은
주소를 바꿔 가며 보내는 요청을 막지 못하므로, IP 단위 제한을 Vercel WAF 사용자 정의 규칙으로 겁니다.
**코드가 아니라 Vercel 프로젝트 설정에 있습니다.**

| 항목 | 값                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| 이름 | `Mail-sending endpoints per-IP limit`                                                                       |
| 조건 | `POST` 그리고 경로가 `/api/auth/signup`, `/api/auth/verification-email`, `/api/auth/password-reset` 중 하나 |
| 기준 | IP당 600초에 20회 (고정 창, 리전별로 따로 셈)                                                               |
| 동작 | 처음에는 `log`(기록만). 트래픽을 확인한 뒤 `rate_limit`(429)으로 바꿉니다                                   |

휴대폰 통신사망처럼 많은 사람이 IP 하나를 나눠 쓰는 경우가 흔해 한도를 넉넉히 잡았습니다. 결제 알림 메일을
그만두며 `/api/notify/subscribe`는 없어졌으므로, 규칙에 남아 있으면 빼도 됩니다.

```bash
vercel firewall rules inspect "Mail-sending endpoints per-IP limit"
vercel firewall rules edit "Mail-sending endpoints per-IP limit" --rate-limit-action rate_limit --yes
vercel firewall diff
vercel firewall publish --yes
```

## 모바일 앱

### PWA

- 웹 매니페스트와 서비스 워커(`public/sw.js`)로 설치형 PWA로 동작합니다. 네트워크가 없을 때는 `/offline`이 뜹니다.
- 안드로이드에서 설치한 뒤 공유 시트에서 SubSlash를 고르면 결제 문자·영수증이 `/share`로 넘어와 파싱됩니다.
- 서비스 워커는 오프라인 안내 화면 하나만 캐시합니다. 앱 셸을 캐시하면 배포 뒤 옛 빌드가 남을 위험만 커집니다.

### 앱 (Capacitor, 안드로이드)

`apps/mobile`은 웹 화면을 정적으로 내보낸 것(`apps/web/out`)을 앱 안에 담고, API는 공개 웹
`https://www.subslash.me`를 부릅니다. 다른 배포를 부르면 DB가 달라 웹에서 만든 계정으로 앱에 로그인할 수 없습니다.

필요한 것: Node 22 이상, **JDK 21**(`JAVA_HOME`), Android SDK(`ANDROID_HOME`). 로컬 알림 플러그인이 정확히
Java 21을 요구하고, Android Studio에 들어 있는 JDK로는 Gradle이 돌지 않습니다. Studio에서도 Gradle JDK를
`JAVA_HOME`(21)으로 고릅니다.

```bash
# 화면을 만들어(apps/web/out) 안드로이드 프로젝트에 복사한다
NEXT_PUBLIC_WEB_ORIGIN=https://www.subslash.me pnpm --filter @subslash/mobile sync

# 고친 것을 폰에서 확인할 때: 테스트용 앱(com.subslash.app.dev)을 스토어 앱 옆에 설치한다
pnpm --filter @subslash/mobile android:dev            # 네이티브만 고쳤으면 -- --skip-web
```

- `NEXT_PUBLIC_WEB_ORIGIN`이 없으면 빌드가 멈춥니다. 앱 안의 화면이 서버 대신 자기 자신을 부르게 되기 때문입니다.
- 저장소 경로에 ASCII가 아닌 글자가 있으면(예: `바탕 화면`) 안드로이드 Gradle 플러그인이 빌드를 거부합니다.
  Windows에서는 `subst S: "<저장소 경로>"`로 영문 드라이브를 연결해 `S:`에서 빌드합니다(되돌리기: `subst S: /D`).
- 확인하려고 versionCode를 올리거나 스토어 앱을 지우지 않습니다. 테스트용 앱은 웹뷰 디버깅이 켜져 있어
  PC 크롬의 `chrome://inspect`로 볼 수 있고, `adb uninstall com.subslash.app.dev`로 지웁니다.
- 결제일 알림은 기기 안의 로컬 알림이라 로그인이 필요 없고, '알림 켜기'를 누를 때 권한을 묻습니다. 정확한 시각
  알람 권한은 쓰지 않아 몇 분 늦게 뜰 수 있습니다.

iOS 앱은 만들지 않습니다(2026년 10월에 `apps/mobile/ios`를 걷었습니다).

### EAS 클라우드 빌드

Expo 프로젝트 `@leesean2/subslash-mobile`을 씁니다. 앱은 Capacitor라 `expo` 패키지는 넣지 않고 EAS가 읽는
`app.json`·`eas.json`만 둡니다.

```bash
cd apps/mobile
eas build --platform android --profile preview       # 기기에 바로 설치하는 APK
eas build --platform android --profile production    # 스토어용 AAB
```

- 설치 뒤 훅(`scripts/eas-build-post-install.sh`)이 JDK 21을 받고(EAS 이미지에는 JDK 17뿐), 웹 화면을 만들어 `cap sync`합니다.
- 서명 키는 EAS 서버에 둡니다(`eas credentials`).
- EAS는 작업 폴더를 `.gitignore` 기준으로 올립니다. `.easignore`를 만들면 `.gitignore`를 통째로 대신해 `.env`까지
  올라갈 수 있으니 만들지 않습니다.

## PC의 AI 코딩 도구 사용 (subslash-usage)

사용자는 웹의 `/pc-usage`에서 기록 폴더나 파일을 고르면 됩니다(브라우저가 기기 안에서 읽음). 같은 셈을 하는
명령줄 도구가 `apps/usage-cli`에 있습니다(의존성은 esbuild로 묶음).

```bash
pnpm --filter subslash-usage start             # 빌드하고 실행 (npm에 올린 뒤에는 npx subslash-usage)
pnpm --filter subslash-usage start -- --json   # 결과를 JSON으로
```

- 읽는 것: Claude Code(`~/.claude/projects/**/*.jsonl`)·Codex(`~/.codex/sessions/**/rollout-*.jsonl`)의 질문 시각과
  요금제 칸, Cursor·Antigravity의 SQLite 기록에서 필요한 칸, 지금 로그인 방식(`~/.claude.json`의 구독 계정,
  `~/.codex/auth.json`의 `auth_mode`). 질문·답 내용은 읽지 않습니다. API 키로 쓴 세션은 구독 사용이 아니라 세지 않습니다.
- 결과로 `https://www.subslash.me/pc-usage#pc=claude-pro:12&window=30&until=…` 링크를 보여 줍니다. 숫자는 `#` 뒤에만
  있어 서버로 가지 않고, 링크를 열면 숫자가 채워진 체크인 창이 뜹니다. 저장은 사용자가 확인을 눌러야 됩니다.

## 실사용자를 받기 전에

지금은 수업 시연 단계라 아래가 미뤄져 있습니다. **팀원·평가자 밖의 사람에게 가입을 받기 시작하면** 그 전에 확인합니다.

- [ ] `privacy@subslash.me`로 온 메일이 실제로 도착하는지 시험합니다. Namecheap의 Redirect Email로 전달만 걸어
      두었으므로, 전달이 끊기면 방침에 적힌 연락처가 죽은 주소가 됩니다.
- [ ] 그 주소로 **답장**할 수 있게 해 둡니다. Namecheap 전달은 수신 전용이라 그냥 답장하면 개인 주소가 드러납니다.
      Resend가 이미 이 도메인을 인증해 두었으니 그 SMTP를 Gmail의 '다른 주소에서 메일 보내기'에 등록하면 됩니다.
- [ ] 보호책임자 연락처에 전화번호를 적을지 정합니다(`lib/privacy.ts`).
- [ ] 배포된 Turso·Vercel의 실제 지역이 방침의 표(일본 도쿄·미국 동부)와 맞는지 봅니다. `vercel.json`에
      `regions`를 적어 두지 않아 프로젝트 기본값을 따릅니다.
- [ ] Gmail 원클릭 연결·Google 계정 용량 측정을 계속 열어 둘 것이면 Google 심사를 신청합니다. 심사 전에는 '확인되지
      않은 앱' 경고와 새 사용자 100명 제한이 있습니다.
